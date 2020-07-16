console.log('background.js');

// A listener to execute scripts on demand
chrome.runtime.onMessage.addListener((msg, evt) => {
  if (msg.script) {
    chrome.tabs.executeScript({
      file: `/js/${msg.script}`,
      frameId: evt.frameId
      // allFrames: true 
    });
  }

});
