console.log("main.js");


const domContent = document.createElement('div');
domContent.id = 'dom-content';
document.body.appendChild(domContent);


// Add button to execute main script
el = document.createElement('button')
domContent.appendChild(el)
el.innerHTML = 'Run Script'
el.onclick = mainScript = () => { 
  chrome.runtime.sendMessage({script: "bot/config.js"});
  chrome.runtime.sendMessage({script: "bot/util.js"});
  chrome.runtime.sendMessage({script: "bot/vision/BallVision.js"});
  chrome.runtime.sendMessage({script: "bot/vision/findAimCircleCentre.js"});
  chrome.runtime.sendMessage({script: "bot/game/GameState.js"});
  chrome.runtime.sendMessage({script: "bot/game/extendAimLine.js"});
  chrome.runtime.sendMessage({script: "bot/game/GameLoop.js"});
  chrome.runtime.sendMessage({script: "bot/game/init.js"});
}

el = document.createElement('p')
domContent.appendChild(el)
el.id = 'text'
el.innerHTML = 'text'

// document.getElementById('engine').getBoundingClientRect()
// JSEvents.eventHandlers[1].handlerFunc({x:384,y:11,preventDefault:()=>{}})
