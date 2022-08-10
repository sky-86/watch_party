/*
Background Scripts are used for responding to browser events independently
of the lifetime of the web page.

Persistent bg scripts load when the extensions loads and stay loaded
Non-persistent(Event pages) load when needed to and unload when idle.

BG scripts run in the context of a special page called a background page

** This script should do all the hard work, (storing state, communicating with server) **
*/

let hostId = -1

function getHostId() {
  return hostId 
}

browser.runtime.onMessage.addListener(handleMessage)

function handleMessage(msg) {
  if (msg.popup === 'host') {
    hostId = 1
    browser.runtime.sendMessage({ "bg": "update", "id": hostId })
  } else if (msg.popup === 'connect') {
    hostId = 2
    browser.runtime.sendMessage({ "bg": "update", "id": hostId })
  }
}
