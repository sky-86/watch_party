// called when popup page is loaded; use to update element states
function onLoad() {
  const bg = browser.extension.getBackgroundPage()
  let id = bg.getHostId()
  document.getElementById("hostBtn").innerHTML = id
}

function host() {
  browser.runtime.sendMessage({ "popup": "host" })
}

function connect() {
  browser.runtime.sendMessage({ "popup": "connect" })
}

// detects button clicks and calls associated function
function listenForClicks() {
  onLoad()
  document.addEventListener('click', (e) => {
    const activeTab = browser.tabs.query({ active: true, currentWindow: true })

    if (e.target.id === 'hostBtn') {
        activeTab.then(host)
    } else if (e.target.id === 'connectBtn') {
        activeTab.then(connect)
    }
  })
}

// load content script whenever user opens popup
browser.tabs.executeScript({ file: '/content/video.js' })
  .then(listenForClicks)

// listen for messages from background script
browser.runtime.onMessage.addListener(handleMessage)

function handleMessage(msg) {
  if (msg.bg === 'update') {
    document.getElementById("hostBtn").innerHTML = msg.id
  }
}
