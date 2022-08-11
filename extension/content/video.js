/*
Content scripts are injected into the webpage.

They run in the context of the current page.

Active Tab gives permission to use the current tab whenever the user
clicks on your extension.

** This script should only listen for msgs from the bg script and
    interact with the video/page. **
*/

// every message sent from the video script should start with video

(function() {
  // run this page only once
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  const video = document.querySelector('video');
  const url = document.URL;

  browser.runtime.sendMessage({ "video": "url", "url": url })
  video.pause()

  video.onplay = (e) => {
    browser.runtime.sendMessage({ "video": "play" })
  }

  video.onpause = (e) => {
    browser.runtime.sendMessage({ "video": "pause" })
  }

  video.onprogress = (e) => {
    browser.runtime.sendMessage({ "video": "progress", "time": Math.floor(video.currentTime) })
  }

  video.onseeked = (e) => {
    browser.runtime.sendMessage({ "video": "seeked", "time": Math.floor(video.currentTime) })
  }

  video.onwaiting = (e) => {
    browser.runtime.sendMessage({ "video": "waiting" })
  }

  video.onloadeddata = (e) => {
    browser.runtime.sendMessage({ "video": "loaded" })
  }

  function handleMessage(msg) {
    if (msg.request == 'play') {
      video.play()
    } else if (msg.request == 'pause') {
      video.pause()
    } else if (msg.request == 'progress') {
      let myTime = Math.floor(video.currentTime)
      let diff = Math.abs(myTime - msg.time)
      if (diff > 2) {
        video.currentTime = msg.time
      }
    } else if (msg.request == 'seeked') {
      video.currentTime = msg.time
    } else if (msg.request == 'buffering') {
    } else if (msg.request == 'loaded') {
    } else if (msg.request == 'url') {
      location.href = msg.url;
      //document.getElementsByClassName("ytp-large-play-button")[0].click()
    }

  }

  browser.runtime.onMessage.addListener(handleMessage)
})()
