// need to store state using storage api

function listenForClicks () {
  document.addEventListener('click', (e) => {
    function pause (tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'pause'
      })
    }

    function host (tabs) {
      // becomeHost()
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'host'
      })
    }

    function connect (tabs) {
      // becomeClient()
      const hostId = document.getElementById('host_id').value
      if (hostId.trim().length !== 0) {
        browser.tabs.sendMessage(tabs[0].id, {
          command: hostId
        })
      }
    }

    if (e.target.classList.contains('pause')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(pause)
        .catch(reportError)
    } else if (e.target.classList.contains('host')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(host)
        .catch(reportError)
    } else if (e.target.classList.contains('connect')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(connect)
        .catch(reportError)
    }
  })
}

function reportExecuteScriptError (error) {
  document.querySelector('#popup-content').classList.add('hidden')
  document.querySelector('#error-content').classList.remove('hidden')
  console.error(`Failed to execute watch_party content script: ${error.message}`)
}

function becomeHost () {
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('guest').classList.add('hidden')
  document.getElementById('host').classList.remove('hidden')
}

function becomeClient () {
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('host').classList.add('hidden')
  document.getElementById('guest').classList.remove('hidden')
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: '/content_scripts/watch_party.js' })
  .then(listenForClicks)
  .catch(reportExecuteScriptError)
