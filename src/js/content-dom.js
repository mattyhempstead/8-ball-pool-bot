/*
  This script adds things to the DOM
*/

console.log('changing dom')

const domContent = document.createElement('div')
document.body.appendChild(domContent)


// Add button to execute opencv.js
el = document.createElement('button')
domContent.appendChild(el)
el.innerHTML = 'opencv.js'
el.onclick = () => { chrome.runtime.sendMessage({script: "opencv.js"}) }


// Add button to execute main script
el = document.createElement('button')
domContent.appendChild(el)
el.innerHTML = 'main script'
el.onclick = mainScript = () => { 
  chrome.runtime.sendMessage({script: "config.js"})
  chrome.runtime.sendMessage({script: "detectBalls.js"})
  chrome.runtime.sendMessage({script: "updateShootingStage.js"})
  chrome.runtime.sendMessage({script: "findAimCircleCentre.js"})
  chrome.runtime.sendMessage({script: "extendAimLine.js"})
  chrome.runtime.sendMessage({script: "content.js"})
}

el = document.createElement('p')
domContent.appendChild(el)
el.id = 'text'
el.innerHTML = 'text'
