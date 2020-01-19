/*
    As readPixels on a webgl canvas returns the pixels upside down, the detect balls
    function will return the positions of balls with the y position flipped vertically.
    Thus I should remember to take this into account when using the ball positions.


    If the opponent does not hit the ball and gets timed out, their cue will
    appear in the frame when their turn ends.
    This is true for local games, but I will need to check this for a real game.

    Instead, I should detect the balls after my shot in the frame when
    it switches to the opponents turn.
    Then, if it turns out the opponent does not take a shot, the current set
    of detected balls should represent the current ball layout (as nothing
    should have moved since this frame was taken)
*/

balls = []

tempCanv = undefined
if (document.getElementById('tempCanv') == null) {
    tempCanv = document.createElement('canvas')
    document.body.appendChild(tempCanv)
    tempCanv.id = 'tempCanv'
    tempCanv.width = tableRectOuter.w
    tempCanv.height = tableRectOuter.h
    tempCanv.style.width = tableRectOuter.w
    tempCanv.style.height = tableRectOuter.h
    tempCanv.style.border = '1px solid black'
    tempCanv.style['margin-left'] = '5px'
} else {
    tempCanv = document.getElementById('tempCanv')
}
tempCtx = tempCanv.getContext('2d')


function detectBalls() {
    // Note that this is flipped
    const imgData = new ImageData(gamePixelsPrevious, gl.drawingBufferWidth, gl.drawingBufferHeight)
    tempCtx.putImageData(imgData, -tableRectOuter.x, -(gh - tableRectOuter.y - tableRectOuter.h))
    // tempCtx.drawImage(gameCanvas, -tableRectOuter.x, -tableRectOuter.y)

    tempCanvMat = cv.imread(tempCanv)

    // Convert to greyscale
    cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_RGBA2GRAY)
    // cv.imshow(tempCanv, tempCanvMat);


    // Get circles
    circleMat = new cv.Mat()
    PARAM_1 = 10
    PARAM_2 = 15
    cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 25, PARAM_1, PARAM_2, 12, 14);


    cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_GRAY2RGBA)


    // Draw circles on image
    balls = []
    for (let i = 0; i < circleMat.cols; ++i) {
        let x = circleMat.data32F[i * 3];
        let y = circleMat.data32F[i * 3 + 1];
        let radius = circleMat.data32F[i * 3 + 2];

        balls.push(findBallCentre({x,y,radius}));

        // let center = new cv.Point(x, y);
        // cv.circle(tempCanvMat, center, radius, [255, 0, 0, 255], 1);

        let centerNew = new cv.Point(balls[i].x, balls[i].y);
        cv.circle(tempCanvMat, centerNew, balls[i].radius, [0, 255, 0, 255], 1);

        console.log({x,y,radius}, balls[i])
    }

    console.log(`detected ${balls.length} balls`)

    cv.imshow(tempCanv, tempCanvMat);

}




BALL_TEMP_CANV_SIZE = 34
ballTempCanv = undefined
ballTempCtx = undefined
if (document.getElementById('ballTempCanv') == null) {
    ballTempCanv = document.createElement('canvas')
    document.body.appendChild(ballTempCanv)
    ballTempCanv.id = 'ballTempCanv'
    ballTempCanv.width = BALL_TEMP_CANV_SIZE
    ballTempCanv.height = BALL_TEMP_CANV_SIZE
    ballTempCanv.style.width = BALL_TEMP_CANV_SIZE
    ballTempCanv.style.height = BALL_TEMP_CANV_SIZE
    ballTempCanv.style.border = '1px solid black'
    ballTempCanv.style['margin-left'] = '5px'
    ballTempCtx = ballTempCanv.getContext('2d')
} else {
    ballTempCanv = document.getElementById('ballTempCanv')
    ballTempCtx = ballTempCanv.getContext('2d')
}

/**
 * Uses the general location of a pool ball to find a more accurate centre
 * @param {*} ball the ball 
 */
function findBallCentre(ball) {

    ballTempCtx.drawImage(
        tempCanv, 
        -ball.x + BALL_TEMP_CANV_SIZE/2, 
        -ball.y + BALL_TEMP_CANV_SIZE/2
    )

    ballTempCanvMat = cv.imread(ballTempCanv)


    // Convert to greyscale
    cv.cvtColor(ballTempCanvMat, ballTempCanvMat, cv.COLOR_RGBA2GRAY)
//     cv.imshow(ballTempCanv, ballTempCanvMat);


    // Get circles
    let ballTempMat = new cv.Mat()
    PARAM_1 = 50
    PARAM_2 = 20
    MIN_RADIUS = 14
    MAX_RADIUS = 15
    cv.HoughCircles(ballTempCanvMat, ballTempMat, cv.HOUGH_GRADIENT, 1, 20, PARAM_1, PARAM_2, MIN_RADIUS, MAX_RADIUS);

    
    // If no circle can be found for some reason, simply return the original circle
    if (ballTempMat.cols !== 1) {
        console.log(`failed to locate a single ball (found ${ballTempMat.cols})`)
        return ball
    }


    // Draw circle
    cv.cvtColor(ballTempCanvMat, ballTempCanvMat, cv.COLOR_GRAY2RGBA)

    let x = ballTempMat.data32F[0];
    let y = ballTempMat.data32F[1];
    let radius = ballTempMat.data32F[2];
    let center = new cv.Point(x, y);
    cv.circle(ballTempCanvMat, center, radius, [0, 255, 0, 255], 1);

    cv.imshow(ballTempCanv, ballTempCanvMat);



    return {
        x: ball.x + x - BALL_TEMP_CANV_SIZE/2,
        y: ball.y - y + BALL_TEMP_CANV_SIZE/2,
        radius: radius
    }
}
