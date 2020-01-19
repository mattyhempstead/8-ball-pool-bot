iFrameDocument = document.getElementById('iframe-game').contentDocument

// TEMP: First remove all existing overlay canvas's
for (let oldOverlay of iFrameDocument.getElementsByClassName('overlay')) {
    window.cancelAnimationFrame(oldOverlay.render)
    oldOverlay.parentNode.removeChild(oldOverlay)
}


gameCanvas = iFrameDocument.getElementById('engine')
gl = gameCanvas.getContext("webgl2") || gameCanvas.getContext('webgl')

if (!gl.getContextAttributes().preserveDrawingBuffer) {
    throw Error("webgl canvas context has attribute preserveDrawingBuffer set false and is thus not readable.")
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
// Only one of these points needs to be true for the player to be in a game
// The reason we have 2 is that the pool cue will occasionally cover up one of the points
PLAYING_GAME_TEST_POINTS = [
    { x:523, y:60, r:79, g:75, b:95 },
    { x:631, y:60, r:84, g:81, b:100 }
]
function isPlayingGame() {
    for (testPoint of PLAYING_GAME_TEST_POINTS) {
        testPixel = getPixel(testPoint.x, testPoint.y)
        if (testPixel[0] === testPoint.r 
         && testPixel[1] === testPoint.g
         && testPixel[2] === testPoint.b) {
            return true
        }
    }
    return false
}



fps = {
    frameCount: 0,
    nextFrameTimestamp: 1000,
    fps: 0
}

gamePixelsPrevious = undefined; //new Uint8ClampedArray(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
gamePixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)

function render(timestamp) {
    // Store the previous frame game pixels before next read
    gamePixelsPrevious = new Uint8ClampedArray(gamePixels)
    
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


        updateShootingStage();



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
