/*
    This script is for finding the most accurate location for the aim circle

    Currently we use two steps:
    First we find the general location of the aim circle centre (give or take a
    few pixels) by searching for a set of 5 carefully placed/coloured pixels.
    Then we pass a small image containing the aim circle to a circle location
    function in opencv.
    This method is more accurate than simply the 5 pixel search, however manual
    analysis of its result will often produce more accurate centres.

    Since the aim circle seems to be rendered almost identically always, I
    could probably get better results through solely a 9 pixel search, where
    the each side takes into account the width of the circle.

*/

/**
 * Finds the general location of the white circle used for aiming pool shots.
 */
AIM_CIRCLE_RADIUS = 13
function findAimCircle() {
    for (let y = tableRectOuter.y; y < tableRectOuter.y + tableRectOuter.h; y++) {
        for (let x = tableRectOuter.x; x < tableRectOuter.x + tableRectOuter.w; x++) {
            /*
                Check center and AIM_CIRCLE_RADIUS pixels in each direction for #FFF.
                The aim circle seems to be the only point in the table which satisfies
                the condition of having white in the center and AIM_CIRCLE_RADIUS
                pixels in all directions at once.
            */

            if (getWhiteness(getIndex(x, y)) !== 765) continue
            if (getWhiteness(getIndex(x - AIM_CIRCLE_RADIUS, y)) !== 765) continue
            if (getWhiteness(getIndex(x + AIM_CIRCLE_RADIUS, y)) !== 765) continue
            if (getWhiteness(getIndex(x, y - AIM_CIRCLE_RADIUS)) !== 765) continue
            if (getWhiteness(getIndex(x, y + AIM_CIRCLE_RADIUS)) !== 765) continue
            
//             // Draw red dot in center of aim circle
//             ctx.fillStyle = 'green'
//             ctx.beginPath()
//             ctx.arc(x, y, 1, 0, 2 * Math.PI, false)
//             ctx.fill()

            return findAimCircleCentre({ x, y })
        }
    }
}


/*
    Uses the general location of the aim circle to find a more accurate centre
*/
AIM_CIRCLE_TEMP_CANV_SIZE = 34
aimCircleTempCanv = undefined
aimCircleTempCtx = undefined
if (document.getElementById('aimCircleTempCanv') == null) {
    aimCircleTempCanv = document.createElement('canvas')
    document.body.appendChild(aimCircleTempCanv)
    aimCircleTempCanv.id = 'aimCircleTempCanv'
    aimCircleTempCanv.width = AIM_CIRCLE_TEMP_CANV_SIZE
    aimCircleTempCanv.height = AIM_CIRCLE_TEMP_CANV_SIZE
    aimCircleTempCanv.style.width = AIM_CIRCLE_TEMP_CANV_SIZE
    aimCircleTempCanv.style.height = AIM_CIRCLE_TEMP_CANV_SIZE
    aimCircleTempCanv.style.border = '1px solid black'
    aimCircleTempCanv.style['margin-left'] = '5px'
    aimCircleTempCtx = aimCircleTempCanv.getContext('2d')
} else {
    aimCircleTempCanv = document.getElementById('aimCircleTempCanv')
    aimCircleTempCtx = aimCircleTempCanv.getContext('2d')
}
function findAimCircleCentre(aimCircle) {
    aimCircleTempCtx.drawImage(
        gameCanvas, 
        -aimCircle.x + AIM_CIRCLE_TEMP_CANV_SIZE/2, 
        -aimCircle.y + AIM_CIRCLE_TEMP_CANV_SIZE/2
    )

    aimCircleTempCanvMat = cv.imread(aimCircleTempCanv)


    // Convert to greyscale
    cv.cvtColor(aimCircleTempCanvMat, aimCircleTempCanvMat, cv.COLOR_RGBA2GRAY)
//     cv.imshow(aimCircleTempCanv, aimCircleTempCanvMat);


    // Get circles
    circleMat = new cv.Mat()
    PARAM_1 = 50
    PARAM_2 = 15
    cv.HoughCircles(aimCircleTempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 25, PARAM_1, PARAM_2, 11, 12);


    // Draw circle
    cv.cvtColor(aimCircleTempCanvMat, aimCircleTempCanvMat, cv.COLOR_GRAY2RGBA)
    for (let i = 0; i < circleMat.cols; ++i) {
        let x = circleMat.data32F[i * 3];
        let y = circleMat.data32F[i * 3 + 1];
        let radius = circleMat.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);
        cv.circle(aimCircleTempCanvMat, center, radius, [255, 0, 0, 255], 1);
        // console.log(x,y,radius)
    }
    cv.imshow(aimCircleTempCanv, aimCircleTempCanvMat);



    // If no circle can be found for some reason, simply return the original circle
    if (circleMat.cols === 0) return aimCircle

    return {
        x: aimCircle.x + circleMat.data32F[0] - AIM_CIRCLE_TEMP_CANV_SIZE/2,
        y: aimCircle.y + circleMat.data32F[1] - AIM_CIRCLE_TEMP_CANV_SIZE/2
    }
}
