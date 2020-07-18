/*
  A script to extend the aim assist line for the ball being hit
  Requires the position of the aim circle
*/

LINE_RADIUS_CHECK_INNER = 9
LINE_RADIUS_CHECK_BORDER = 23
LINE_RADIUS_CHECK_MIDDLE = 27
LINE_RADIUS_CHECK_OUTER = 30
function extendAimLine(aimCircle) {

//     ctx.strokeStyle = 'red'
//     ctx.lineWidth = 1
//     ctx.beginPath()
//     ctx.arc(aimCircle.x, aimCircle.y, LINE_RADIUS_CHECK_INNER, 0, 2 * Math.PI, false);
//     ctx.stroke()
//     ctx.beginPath()
//     ctx.arc(aimCircle.x, aimCircle.y, LINE_RADIUS_CHECK_BORDER, 0, 2 * Math.PI, false);
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

    let darkestValue = 765
    let darkestAngle = 0

    for (let angle = 0; angle < 2*Math.PI; angle += 0.02) {

        /*
            I could check a small angle offset remains white.
            This would ensure the chosen angle is the centre of the thick aim
            line rather than potentially one of the edges.
        */

        let xMiddle = Math.round(aimCircle.x + LINE_RADIUS_CHECK_MIDDLE * Math.cos(angle))
        let yMiddle = Math.round(aimCircle.y + LINE_RADIUS_CHECK_MIDDLE * Math.sin(angle))
        if (getWhiteness(getIndex(xMiddle, yMiddle)) !== 765) continue

        let xOuter = Math.round(aimCircle.x + LINE_RADIUS_CHECK_OUTER * Math.cos(angle))
        let yOuter = Math.round(aimCircle.y + LINE_RADIUS_CHECK_OUTER * Math.sin(angle))
        if (getWhiteness(getIndex(xOuter, yOuter)) !== 765) continue

        let xOuter2 = Math.round(aimCircle.x + 28 * Math.cos(angle))
        let yOuter2 = Math.round(aimCircle.y + 28 * Math.sin(angle))
        if (getWhiteness(getIndex(xOuter2, yOuter2)) !== 765) continue

        let xInner = Math.round(aimCircle.x + LINE_RADIUS_CHECK_INNER * Math.cos(angle))
        let yInner = Math.round(aimCircle.y + LINE_RADIUS_CHECK_INNER * Math.sin(angle))
        if (getWhiteness(getIndex(xInner, yInner)) === 765) continue

        let xBorder = Math.round(aimCircle.x + LINE_RADIUS_CHECK_BORDER * Math.cos(angle))
        let yBorder = Math.round(aimCircle.y + LINE_RADIUS_CHECK_BORDER * Math.sin(angle))
        let darkness = getWhiteness(getIndex(xBorder, yBorder))
        if (darkness <= darkestValue) {
            darkestValue = darkness
            darkestAngle = angle
        }

        angleSum += angle;
        angleCount++;
        
    }

    if (angleCount === 0) return

    let angle = darkestAngle//angleSum / angleCount

//     let xBorder = Math.round(aimCircle.x + LINE_RADIUS_CHECK_BORDER * Math.cos(angle))
//     let yBorder = Math.round(aimCircle.y + LINE_RADIUS_CHECK_BORDER * Math.sin(angle))
//     console.log(getWhiteness(getIndex(xBorder, yBorder)), darkestValue)

//     ctx.beginPath()
//     ctx.arc(xMiddle, yMiddle, 2, 0, 2 * Math.PI, false)
//     ctx.fill()
//     ctx.fillStyle = (angle >= 1/2 * Math.PI && angle <= 3/2 * Math.PI) ? "red" : "green"
//     ctx.beginPath()
//     ctx.arc(xOuter, yOuter, 2, 0, 2 * Math.PI, false)
//     ctx.fill()


    // Extend line between aimCircle and outer

    xEnd = TABLE_RECT_OUTER.x + ((angle <= 1/2 * Math.PI || angle >= 3/2 * Math.PI) && TABLE_RECT_OUTER.w)
    yEnd = aimCircle.y + (xEnd - aimCircle.x) * Math.tan(angle)


    ctx.strokeStyle = 'orange'
    ctx.lineWidth = 2
    ctx.beginPath();
    ctx.moveTo(aimCircle.x, aimCircle.y);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

}
