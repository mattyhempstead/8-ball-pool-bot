/*
  Injects a script directly into the DOM to allow execution of scripts from 
  within the same JS environment used by applications on the page.
*/

const injectScripts = ['webglContextWrapper', 'triggerCanvasEvents'];
for (let scriptName of injectScripts) {
  let script = document.createElement('script');
  script.src = chrome.extension.getURL(`js/inject/${scriptName}.js`);
  document.body.appendChild(script);  
}
