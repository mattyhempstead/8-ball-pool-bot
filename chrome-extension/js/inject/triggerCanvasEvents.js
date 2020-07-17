/*
  Used to trigger events on the canvas by accessing calling event handlers defined only 
  on the DOM JS environment.
*/
console.log('triggerCanvasEvents.js');

window.addEventListener('message', function(event) {
  if (event.source != window) return;
  if (event.data.source !== '8-ball-pool-bot') return;

  let eventNum = -1;
  if (event.data.type === 'mousemove') eventNum = 1;
  else if (event.data.type === 'mousedown') eventNum = 2;
  else if (event.data.type === 'mouseup') eventNum = 3;

  const canvasRect = document.getElementById('engine').getBoundingClientRect();
  JSEvents.eventHandlers[eventNum].handlerFunc({
    x: canvasRect.x + event.data.x,
    y: canvasRect.y + event.data.y,
    preventDefault: ()=>{}
  });
});
