/*
Background Scripts are used for responding to browser events independently
of the lifetime of the web page.

Persistent bg scripts load when the extensions loads and stay loaded
Non-persistent(Event pages) load when needed to and unload when idle.

BG scripts run in the context of a special page called a background page
*/


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
    browser.runtime.sendMessage({ reload: hostId })
  } else if (request.socket === 'close') {
    browser.runtime.reload()
  }
}

browser.runtime.onMessage.addListener(handleMessage)
