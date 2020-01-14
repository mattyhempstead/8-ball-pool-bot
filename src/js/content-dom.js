/*
  This script adds things to the DOM
*/

console.log('changing dom')

const domContent = document.createElement('div')
document.body.appendChild(domContent)


domContent.innerHTML = 'Test'
