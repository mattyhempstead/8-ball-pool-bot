
tempCanv = undefined

if (document.getElementById('tempCanv') == null) {
    tempCanv = document.createElement('canvas')
    document.body.appendChild(tempCanv)
    tempCanv.id = 'tempCanv'
    tempCanv.width = tableRectOuter.w
    tempCanv.height = tableRectOuter.h
    tempCanv.style.width = tableRectOuter.w
    tempCanv.style.height = tableRectOuter.h
    tempCtx = tempCanv.getContext('2d')
    tempCanv.style.border = '1px solid black'
    tempCanv.style['margin-left'] = '5px'
} else {
    tempCanv = document.getElementById('tempCanv')
}


tempCtx.drawImage(gameCanvas, -tableRectOuter.x, -tableRectOuter.y)
tempCanvMat = cv.imread(tempCanv)

// Convert to greyscale
cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_RGBA2GRAY)
// cv.imshow(tempCanv, tempCanvMat);


// cv.bitwise_not(tempCanvMat, tempCanvMat)



// Get circles
circleMat = new cv.Mat()
PARAM_1 = 10
PARAM_2 = 15
cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 25, PARAM_1, PARAM_2, 12, 14);



// cv.bitwise_not(tempCanvMat, tempCanvMat)



cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_GRAY2RGBA)


// Draw circles on image
circles = []
for (let i = 0; i < circleMat.cols; ++i) {
    let x = circleMat.data32F[i * 3];
    let y = circleMat.data32F[i * 3 + 1];
    let radius = circleMat.data32F[i * 3 + 2];
    let center = new cv.Point(x, y);
    cv.circle(tempCanvMat, center, radius, [255, 0, 0, 255], 1);

    circles.push({x,y,radius})
}


cv.imshow(tempCanv, tempCanvMat);






