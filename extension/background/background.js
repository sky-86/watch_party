/*
Background Scripts are used for responding to browser events independently
of the lifetime of the web page.

Persistent bg scripts load when the extensions loads and stay loaded
Non-persistent(Event pages) load when needed to and unload when idle.

BG scripts run in the context of a special page called a background page

** This script should do all the hard work, (storing state, communicating with server) **
*/

// ---------------- STATE
let debug = "";
function getDebug() {
  return debug 
}
function updateDebug(msg) {
  debug = msg
  browser.runtime.sendMessage({ "debug": debug })
}

let hostId = -1
function getHostId() {
  return hostId 
}
function updateHostId(id) {
  hostId = id
  browser.runtime.sendMessage({ "hostId": id })
}
let menuState = "modes"
function getMenuState() {
  return menuState 
}

// ---------------------END STATE

let connected = false;
let socket = null
let clientType = null
let url = null
function establishConnection() {
  if (!connected) {
    connected = true;
    socket = new WebSocket('ws://localhost:42069');
    establishListeners()
  }
}

function establishListeners() {
  socket.onmessage = (e) => {
    let data = e.data
    if (clientType === 'host') {
      if (hostId === -1) {
        // need to recieve host Id from server
        updateHostId(data)
      }
    } else if (clientType === 'guest') {
      let request = JSON.parse(data)
      browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        browser.tabs.sendMessage(tabs[0].id, request)
      })
    }
  }
}

function handleMessage(msg) {
  // POPUP
  if (msg.popup === 'onload') {
    establishConnection()
  } else if (msg.popup === 'host') {
    // HOST REQUEST
    menuState = 'hostControls'
    clientType = 'host'
    socket.send(JSON.stringify({client: 'host', url: url}))
  } else if (msg.popup === 'connectForm') {
    menuState = 'connectForm'
  } else if (msg.popup === 'guestControls') {
    // GUEST REQUEST
    clientType = 'guest'
    menuState = 'guestControls'
    socket.send(JSON.stringify({client: 'guest', id: msg.id}))
  } else if (msg.popup === 'modes') {
    menuState = 'modes'
  } else if (msg.popup === 'dc') {
    socket.close()
    connected = false
    hostId = -1
    clientType = null
    menuState = 'modes'
  }

  // VIDEO
  if (clientType === 'host' && hostId != -1) {
    if (msg.video === 'play') {
      socket.send(JSON.stringify({ id: hostId, request: 'play' }))
    } else if (msg.video === 'pause') {
      socket.send(JSON.stringify({ id: hostId, request: 'pause' }))
    } else if (msg.video === 'progress') {
      socket.send(JSON.stringify({ id: hostId, request: 'progress', time: msg.time }))
    } else if (msg.video === 'seeked') {
      socket.send(JSON.stringify({ id: hostId, request: 'seeked', time: msg.time }))
    } else if (msg.video === 'waiting') {
      socket.send(JSON.stringify({ id: hostId, request: 'buffering' }))
    } else if (msg.video === 'loaded') {
      socket.send(JSON.stringify({ id: hostId, request: 'loaded' }))
    }
  }

  if (msg.video === 'url') {
    url = msg.url
  }
}

browser.runtime.onMessage.addListener(handleMessage)
