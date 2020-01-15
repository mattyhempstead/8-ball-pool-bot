console.log('background.js')

// A listener to execute scripts on demand
chrome.runtime.onMessage.addListener((msg) => {
  console.log('executing', msg);

  if (msg.script) {
    chrome.tabs.executeScript({
      file: `/js/${msg.script}`,
      // allFrames: true 
    })
  }

})
