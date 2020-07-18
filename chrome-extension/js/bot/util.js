/*
  Various utility functions
*/
console.log('util.js');

function drawCircle(x, y, radius, colour, ctx) {
    // Draw red dot in center of aim circle
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}

function drawLineSegment(x1, y1, x2, y2, lineWidth, colour, ctx) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
