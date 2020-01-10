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

WHITE_CIRCLE_RADIUS = 13
WHITE_CIRCLE_RADIUS_SQRT2 = Math.round(WHITE_CIRCLE_RADIUS * Math.SQRT2)


// Returns the index in the gamePixels array of a given x,y coord on gameCanvas
function getIndex(x, y) {
    return 4 * ((gh - y) * gw + x)
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



/**
 * Finds the centre of the white circle used for aiming pool shots.
 * 
 * Often there are multiple pixels which satisfy the requirements, thus I
 * should implement a system which averages out these potential spots to give a
 * more accurate location.
 */
function findAimCircle() {
    for (let y = tableRectOuter.y; y < tableRectOuter.y + tableRectOuter.h; y++) {
        for (let x = tableRectOuter.x; x < tableRectOuter.x + tableRectOuter.w; x++) {
            /*
                Check center and +-10 pixels in each direction for ~whites
                The larger the circle value, the more likely this pixel is the center
                of the white circle.
            */

            if ((mm = getWhiteness(getIndex(x, y))) <= 760) continue
            if ((lm = getWhiteness(getIndex(x - WHITE_CIRCLE_RADIUS, y))) <= 760) continue
            if ((rm = getWhiteness(getIndex(x + WHITE_CIRCLE_RADIUS, y))) <= 760) continue
            if ((mb = getWhiteness(getIndex(x, y - WHITE_CIRCLE_RADIUS))) <= 760) continue
            if ((mt = getWhiteness(getIndex(x, y + WHITE_CIRCLE_RADIUS))) <= 760) continue
            
            circleValue = mm + lm + rm + mb + mt

//               + getWhiteness(getIndex(x + WHITE_CIRCLE_RADIUS_SQRT2, y + WHITE_CIRCLE_RADIUS_SQRT2))
//               + getWhiteness(getIndex(x + WHITE_CIRCLE_RADIUS_SQRT2, y - WHITE_CIRCLE_RADIUS_SQRT2))
//               + getWhiteness(getIndex(x - WHITE_CIRCLE_RADIUS_SQRT2, y + WHITE_CIRCLE_RADIUS_SQRT2))
//               + getWhiteness(getIndex(x - WHITE_CIRCLE_RADIUS_SQRT2, y - WHITE_CIRCLE_RADIUS_SQRT2))
              
            console.log(x, y, maxCircleValue)
              

            // Draw rect around pool table
            ctx.fillStyle = 'red'
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI, false)
            ctx.fill()

//             ctx.beginPath()
//             ctx.arc(x + WHITE_CIRCLE_RADIUS, y, 2, 0, 2 * Math.PI, false)
//             ctx.fill()

//             ctx.beginPath()
//             ctx.arc(x, y + WHITE_CIRCLE_RADIUS, 2, 0, 2 * Math.PI, false)
//             ctx.fill()

            return { x, y }
        }
    }
}


// Extends the aim assist line for the ball being hit
LINE_RADIUS_CHECK_INNER = 9
LINE_RADIUS_CHECK_MIDDLE = 26
LINE_RADIUS_CHECK_OUTER = 30
function extendAimLine(aimCircle) {

//     ctx.strokeStyle = 'red'
//     ctx.lineWidth = 1
//     ctx.beginPath()
//     ctx.arc(aimCircle.x, aimCircle.y, LINE_RADIUS_CHECK_INNER, 0, 2 * Math.PI, false);
//     ctx.stroke()
//     ctx.beginPath()
//     ctx.arc(aimCircle.x, aimCircle.y, LINE_RADIUS_CHECK_MIDDLE, 0, 2 * Math.PI, false);
//     ctx.stroke()
//     ctx.beginPath()
//     ctx.arc(aimCircle.x, aimCircle.y, LINE_RADIUS_CHECK_OUTER, 0, 2 * Math.PI, false);
//     ctx.stroke()

    // Check a full circle around the ball
    // Get the average angle which satisfies the aim line conditions

    let angleSum = 0
    let angleCount = 0

    for (let angle = 0; angle < 2*Math.PI; angle += 0.03) {

        let xMiddle = aimCircle.x + Math.round(LINE_RADIUS_CHECK_MIDDLE * Math.cos(angle))
        let yMiddle = aimCircle.y + Math.round(LINE_RADIUS_CHECK_MIDDLE * Math.sin(angle))
        if (getWhiteness(getIndex(xMiddle, yMiddle)) !== 765) continue

        let xOuter = aimCircle.x + Math.round(LINE_RADIUS_CHECK_OUTER * Math.cos(angle))
        let yOuter = aimCircle.y + Math.round(LINE_RADIUS_CHECK_OUTER * Math.sin(angle))
        if (getWhiteness(getIndex(xOuter, yOuter)) !== 765) continue

        let xOuter2 = aimCircle.x + Math.round(28 * Math.cos(angle))
        let yOuter2 = aimCircle.y + Math.round(28 * Math.sin(angle))
        if (getWhiteness(getIndex(xOuter2, yOuter2)) !== 765) continue

        let xInner = aimCircle.x + Math.round(LINE_RADIUS_CHECK_INNER * Math.cos(angle))
        let yInner = aimCircle.y + Math.round(LINE_RADIUS_CHECK_INNER * Math.sin(angle))
        if (getWhiteness(getIndex(xInner, yInner)) === 765) continue

        angleSum += angle;
        angleCount++;
        
    }

    if (angleCount === 0) return

    let angle = angleSum / angleCount

//     ctx.beginPath()
//     ctx.arc(xMiddle, yMiddle, 2, 0, 2 * Math.PI, false)
//     ctx.fill()
//     ctx.fillStyle = (angle >= 1/2 * Math.PI && angle <= 3/2 * Math.PI) ? "red" : "green"
//     ctx.beginPath()
//     ctx.arc(xOuter, yOuter, 2, 0, 2 * Math.PI, false)
//     ctx.fill()


    // Extend line between aimCircle and outer

    xEnd = tableRectOuter.x + ((angle <= 1/2 * Math.PI || angle >= 3/2 * Math.PI) && tableRectOuter.w)
    yEnd = aimCircle.y + (xEnd - aimCircle.x) * Math.tan(angle)


    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.beginPath();
    ctx.moveTo(aimCircle.x, aimCircle.y);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

}


// Determines whether or not player is in a game
PLAYING_GAME_TEST_POINTS = [
    { x:107+5, y:194+5, r:18, g:26, b:38 },
    { x:107+10, y:194+10, r:60, g:52, b:64 }
]
function isPlayingGame() {
    for (testPoint of PLAYING_GAME_TEST_POINTS) {
        if (gamePixels[getIndex(testPoint.x, testPoint.y)    ] !== testPoint.r) return false
        if (gamePixels[getIndex(testPoint.x, testPoint.y) + 1] !== testPoint.g) return false
        if (gamePixels[getIndex(testPoint.x, testPoint.y) + 2] !== testPoint.b) return false
    }

    return true
}



function render() {
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

        // Find the position of the aim circle
        let aimCircle = findAimCircle()
    
        // Extend the aim line
        if (aimCircle) extendAimLine(aimCircle)
    }


    overlay.render = window.requestAnimationFrame(render)
}
render()
