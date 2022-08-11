// called when popup page is loaded; use to update element states
function onLoad() {
  // connects to ws
  browser.runtime.sendMessage({ "popup": "onload" })

  // used to keep state
  const bg = browser.extension.getBackgroundPage()
  let id = bg.getHostId()
  document.getElementById("hostId").innerHTML = "HOST ID: " + id

  let debug = bg.getDebug()
  document.getElementById("debug1").innerHTML = debug

  let state = bg.getMenuState();
  showMenu(state);
}

// ----------------------- CLICK EVENTS
function hostClick() {
  showMenu("hostControls")
  browser.runtime.sendMessage({ "popup": "host" })
}

function connectClick() {
  showMenu("connectForm")
  browser.runtime.sendMessage({ "popup": "connectForm" })
}

function connectFormSubmit() {
  showMenu("guestControls")
  let id = document.getElementById('idInput').value
  browser.runtime.sendMessage({ "popup": "guestControls", "id": id })
}

function backClick() {
  showMenu("modes")
  browser.runtime.sendMessage({ "popup": "modes" })
}

function dcClick() {
  showMenu("modes")
  browser.runtime.sendMessage({ "popup": "dc" })
}
// ----------------------- END CLICK EVENTS

// detects button clicks and calls associated function
function listenForClicks() {
  onLoad()
  document.addEventListener('click', (e) => {
    const activeTab = browser.tabs.query({ active: true, currentWindow: true })

    if (e.target.id === 'hostBtn') {
        activeTab.then(hostClick)
    } else if (e.target.id === 'connectBtn') {
        activeTab.then(connectClick)
    } else if (e.target.id === 'connectSubmitBtn') {
        activeTab.then(connectFormSubmit)
    } else if (e.target.id === 'back') {
        activeTab.then(backClick)
    } else if (e.target.id === 'dc') {
        activeTab.then(dcClick)
    }
  })
}

function handleMessage(msg) {
  if (msg.debug) {
    document.getElementById("debug1").innerHTML = msg.debug
  } else if (msg.hostId) {
    document.getElementById("hostId").innerHTML = "HOST ID: " + msg.hostId
  }
}

function showMenu(menu) {
  document.getElementById("modes").classList.add("hidden")
  document.getElementById("hostControls").classList.add("hidden")
  document.getElementById("connectForm").classList.add("hidden")
  document.getElementById("guestControls").classList.add("hidden")
  document.getElementById("dc").classList.add("hidden")

  switch (menu) {
    case "modes":
      document.getElementById("modes").classList.remove("hidden")
      break
    case "hostControls":
      document.getElementById("hostControls").classList.remove("hidden")
      document.getElementById("dc").classList.remove("hidden")
      break
    case "connectForm":
      document.getElementById("connectForm").classList.remove("hidden")
      break
    case "guestControls":
      document.getElementById("guestControls").classList.remove("hidden")
      document.getElementById("dc").classList.remove("hidden")
      break
  }
}

// listen for messages from background script
browser.runtime.onMessage.addListener(handleMessage)

// load content script whenever user opens popup
browser.tabs.executeScript({ file: '/content/video.js' })
  .then(listenForClicks)
