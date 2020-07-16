/*
  Various utility functions
*/
console.log('util.js');

function drawCircle(x, y, radius, colour) {
  // Draw red dot in center of aim circle
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}
