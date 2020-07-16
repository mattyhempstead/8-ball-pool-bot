/*
  Injects a script directly into the DOM to allow execution of scripts from 
  within the same JS environment used by applications on the page.
*/

let injectedScript = document.createElement('script');
injectedScript.src = chrome.extension.getURL('js/webgl-context-wrapper.js');
document.body.appendChild(injectedScript);
