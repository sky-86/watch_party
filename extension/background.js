
let host = null
let hostId = -1

function getHost () {
  return host
}

function setHost () {
  host = true
  return hostId
}

function setGuest () {
  host = false
}

function setHostId (id) {
  hostId = id
}

function getHostId () {
  return hostId
}

function reset () {
  hostId = -1
  host = null
}

// background-script.js
function handleMessage (request, sender, sendResponse) {
  if (request.hostId) {
    hostId = request.hostId
  } else if (request.socket === 'close') {
    browser.runtime.reload()
  }
}

browser.runtime.onMessage.addListener(handleMessage)
