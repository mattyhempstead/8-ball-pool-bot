iFrameDocument = document.getElementById('iframe-game').contentDocument

// TEMP: First remove all existing overlay canvas's
for (let oldOverlay of iFrameDocument.getElementsByClassName('overlay')) {
    window.cancelAnimationFrame(oldOverlay.render)
    oldOverlay.parentNode.removeChild(oldOverlay)
}


gameCanvas = iFrameDocument.getElementById('engine')
gw = gameCanvas.width
gh = gameCanvas.height
gl = gameCanvas.getContext("webgl2") || gameCanvas.getContext('webgl')

if (!gl.getContextAttributes().preserveDrawingBuffer) {
    throw Error("webgl canvas context has attribute preserveDrawingBuffer set false and is thus not readable.")
}

gamePixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)

gameGrid = []
for (let y = 0; y < gh; y++) {
    gameGrid.push([])
    for (let x = 0; x < gw; x++) {
        gameGrid[y].push([0,0,0])
    }
}



// Just in case this ever becomes true and I don't realise this is causing issues
if (gl.drawingBufferWidth != gw || gl.drawingBufferHeight != gh) {
    throw Error("Internal game resolution is not the same as canvas resolution.")
}


// Insert an overlay canvas
overlay = document.createElement('canvas')
overlay.setAttribute('class', 'overlay')
overlay.width = gw
overlay.height = gh
overlay.style.width = gw
overlay.style.height = gh
overlay.style.position = 'absolute'
overlay.style.top = '0'
overlay.style.left = '0'
overlay.style['z-index'] = '3'
overlay.style['pointer-events'] = 'none'
gameCanvas.insertAdjacentElement('afterend', overlay)
ctx = overlay.getContext('2d')




/*
    There will either be an uninterupted white circle with a white dot 
    in the middle,
    or there will be an uninterupted red circle with a red ascending 
    diagonal line in the middle.

    For the white circle, the centre dot will have a small line which
    extends in the direction the cue ball will follow.

    Seems to be radius of 10px
    Definely drawn as colour #FFF, yet the anti-aliasing means most pixels 
    are not exactly white.


*/

tableRectInner = {
    x: Math.round(gw * 0.117),
    y: Math.round(gh * 0.293),
    w: Math.round(gw * 0.766),
    h: Math.round(gh * 0.600),
}

tableRectOuter = {
    x: Math.round(gw * 0.093),
    y: Math.round(gh * 0.253),
    w: Math.round(gw * 0.816),
    h: Math.round(gh * 0.677),
}



// Returns the index in the gamePixels array of a given x,y coord on gameCanvas
function getIndex(x, y) {
    return 4 * ((gh - y) * gw + x)
}

function getPixel(x, y) {
    return [
        gamePixels[getIndex(x,y)],
        gamePixels[getIndex(x,y)+1],
        gamePixels[getIndex(x,y)+2]
    ]
}

// Returns a number between 0 - 765 (lower is whiter)
// Index is assumed to be the index of the red value in the pixel
function getWhiteness(index) {
    return (
        gamePixels[index]
        + gamePixels[index + 1]
        + gamePixels[index + 2]
     )
}


// Determines whether or not player is in a game
PLAYING_GAME_TEST_POINTS = [
    { x:100, y:20, r:56, g:54, b:68 },
    { x:100, y:60, r:80, g:79, b:98 }
]
function isPlayingGame() {
    for (testPoint of PLAYING_GAME_TEST_POINTS) {
        if (gamePixels[getIndex(testPoint.x, testPoint.y)    ] !== testPoint.r) return false
        if (gamePixels[getIndex(testPoint.x, testPoint.y) + 1] !== testPoint.g) return false
        if (gamePixels[getIndex(testPoint.x, testPoint.y) + 2] !== testPoint.b) return false
    }

    return true
}


PLAYER_TURN_PIXEL = { x:475, y:16 };
OPPONENT_TURN_PIXEL = { x:690, y:16 };

// 0 - opponent is shooting
// 1 - player is shooting
// 2 - waiting stage
shootingStage = 0; 


fps = {
    frameCount: 0,
    nextFrameTimestamp: 1000,
    fps: 0
}


function render(timestamp) {
    // Read pool game canvas pixels
    gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        gamePixels
    )

    ctx.clearRect(0, 0, gw, gh)

    // Calculate and render fps
    fps.frameCount++
    if (timestamp >= fps.nextFrameTimestamp) {
        fps.nextFrameTimestamp = timestamp + 1000
        fps.fps = fps.frameCount
        fps.frameCount = 0
    }
    ctx.font = "16px Arial";
    ctx.fillStyle = '#00ff00'
    ctx.fillText(fps.fps, 5, 20);

    // Draw a border to show cheat mode activated
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.rect(0, 0, gw, gh)
    ctx.stroke()


    if (isPlayingGame()) {

        // Draw rect around pool table
        ctx.strokeStyle = '#55ff55'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.rect(
            tableRectInner.x,
            tableRectInner.y,
            tableRectInner.w,
            tableRectInner.h
        )
        ctx.stroke()

        // Draw rect around pool table
        ctx.strokeStyle = '#55ff55'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.rect(
            tableRectOuter.x,
            tableRectOuter.y,
            tableRectOuter.w,
            tableRectOuter.h
        )
        ctx.stroke()



        const playerTurnLoadingPixel = getPixel(PLAYER_TURN_PIXEL.x, PLAYER_TURN_PIXEL.y)
        const opponentTurnLoadingPixel = getPixel(OPPONENT_TURN_PIXEL.x, OPPONENT_TURN_PIXEL.y)

        // Transition from opponents turn to our turn
        // If opponents turn and we go green, it must be our turn to shoot
        if (shootingStage === 0 && playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
            console.log('opponent has finished turn')
            shootingStage = 2
            window.setTimeout(() => { 
                shootingStage = 1
                console.log('player is ready to shoot')
            }, 200)
        }

        // if currently our turn
        if (shootingStage === 1) {

            // if opponent is green, we must have finished our turn to shoot
            if (opponentTurnLoadingPixel[0] === 0 && opponentTurnLoadingPixel[1] === 255 && opponentTurnLoadingPixel[2] === 0) {
                console.log('player has finished turn')
                shootingStage = 2
                window.setTimeout(() => { 
                    shootingStage = 0
                    console.log('opponent is read to shoot')
                }, 200)
            }
            
            // otherwise if we are green, player must have potted a ball
            else if (playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
                console.log('player has potted a ball')
                shootingStage = 2
                window.setTimeout(() => { 
                    shootingStage = 1
                    console.log('player is ready to shoot')
                }, 200)
            }
        }

        document.getElementById('text').innerHTML = `${shootingStage}`



        // Find the position of the aim circle
        let aimCircle = findAimCircle()
    
        // Extend the aim line
        if (aimCircle) extendAimLine(aimCircle)

        if (aimCircle) {
            // Draw red dot in center of aim circle
            ctx.fillStyle = 'red'
            ctx.beginPath()
            ctx.arc(aimCircle.x, aimCircle.y, 1, 0, 2 * Math.PI, false)
            ctx.fill()
        }
    }

    overlay.render = window.requestAnimationFrame(render)
}
render()
