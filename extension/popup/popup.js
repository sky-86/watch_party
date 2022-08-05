// need to store state using storage api

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
      const id = bg.setHost()
      becomeHost(id)
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'host'
      })
    }

    function connect (tabs) {
      bg.setGuest()
      becomeGuest()
      const hostId = document.getElementById('host_id_input').value
      if (hostId.trim().length !== 0) {
        browser.tabs.sendMessage(tabs[0].id, {
          command: hostId
        })
      }
    }

    function disconnect (tabs) {
      reset()
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'dc'
      })
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
    } else if (e.target.classList.contains('play')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(play)
        .catch(reportError)
    } else if (e.target.classList.contains('dc')) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(disconnect)
        .catch(reportError)
    }
  })
}

function reportExecuteScriptError (error) {
  document.querySelector('#popup-content').classList.add('hidden')
  document.querySelector('#error-content').classList.remove('hidden')
  console.error(`Failed to execute watch_party content script: ${error.message}`)
}

function becomeHost (id) {
  document.getElementById('host_id').innerHTML = id
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('guest').classList.add('hidden')
  document.getElementById('host').classList.remove('hidden')
  document.getElementById('disconnect').classList.remove('hidden')
}

function becomeGuest () {
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('host').classList.add('hidden')
  document.getElementById('guest').classList.remove('hidden')
  document.getElementById('disconnect').classList.remove('hidden')
}

function reset () {
  document.getElementById('modes').classList.remove('hidden')
  document.getElementById('host').classList.add('hidden')
  document.getElementById('guest').classList.add('hidden')
  document.getElementById('disconnect').classList.add('hidden')
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
