import { becomeHost, becomeGuest, reset, reportExecuteScriptError, toggleConnect } from './popup_helper.js'

// button events
function listenForClicks () {
  document.addEventListener('click', (e) => {
    function pause (tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'pause'
      })
    }

    function play (tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'play'
      })
    }

    function host (tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'host'
      })
      const id = bg.setHost()
      becomeHost(id)
    }

    function showConnect (tabs) {
      toggleConnect()
    }

    function connect (tabs) {
      const hostId = document.getElementById('host_id_input').value
      if (hostId !== null) {
        bg.setGuest()
        becomeGuest()
        if (hostId.trim().length !== 0) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: hostId
          })
        }
      }
    }

    function disconnect (tabs) {
      reset()
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'dc'
      })
    }

    if (e.target.classList.contains('host')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(host)
        .catch(reportError)
    } else if (e.target.classList.contains('show_connect')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(showConnect)
        .catch(reportError)
    } else if (e.target.classList.contains('connect')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(connect)
        .catch(reportError)
    } else if (e.target.classList.contains('play')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(play)
        .catch(reportError)
    } else if (e.target.classList.contains('pause')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(pause)
        .catch(reportError)
    } else if (e.target.classList.contains('dc')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(disconnect)
        .catch(reportError)
    }
  })
}

const bg = browser.extension.getBackgroundPage()
if (bg.getHost() === true) {
  const id = bg.getHostId()
  becomeHost(id)
} else if (bg.getHost() === false) {
  becomeGuest()
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: '/content_scripts/watch_party.js' })
  .then(listenForClicks)
  .catch(reportExecuteScriptError)

function handleMessage (request, sender, sendResponse) {
  if (request.reload) {
    document.getElementById('host_id').innerHTML = request.reload
  }
}

browser.runtime.onMessage.addListener(handleMessage)
