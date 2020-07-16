console.log("main.js");




const domContent = document.createElement('div');
domContent.id = 'dom-content';
document.body.appendChild(domContent);


// Add button to execute opencv.js
elOpenCV = document.createElement('button');
domContent.appendChild(elOpenCV);
elOpenCV.innerHTML = 'opencv.js';
elOpenCV.onclick = () => { 
  chrome.runtime.sendMessage({script: "opencv.js"});
  domContent.removeChild(elOpenCV);
}


// Add button to execute main script
el = document.createElement('button')
domContent.appendChild(el)
el.innerHTML = 'main script'
el.onclick = mainScript = () => { 
  chrome.runtime.sendMessage({script: "bot/config.js"});
  chrome.runtime.sendMessage({script: "bot/util.js"});
  chrome.runtime.sendMessage({script: "bot/vision/detectBalls.js"});
  chrome.runtime.sendMessage({script: "bot/vision/findAimCircleCentre.js"});
  chrome.runtime.sendMessage({script: "bot/game/updateShootingStage.js"});
  chrome.runtime.sendMessage({script: "bot/game/extendAimLine.js"});
  chrome.runtime.sendMessage({script: "bot/game/content.js"});
}

el = document.createElement('p')
domContent.appendChild(el)
el.id = 'text'
el.innerHTML = 'text'


// JSEvents.eventHandlers[1].handlerFunc({x:384,y:17,preventDefault:()=>{}})
