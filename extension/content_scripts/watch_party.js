(function () {
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  function openSocket () {
    return new WebSocket('ws://44.204.233.239:42069')
  }

  const socket = openSocket()

  socket.onmessage = function (event) {
    if (event.data === 'pause') {
      pause()
    } else if (!isNaN(event.data)) {
      browser.runtime.sendMessage({ hostId: event.data })
    } else if (event.data === 'play') {
      play()
    }
  }

  socket.onclose = function (event) {
    browser.runtime.sendMessage({ socket: 'close' })
    if (event.wasClean) {
    } else {
    }
  }

  // socket.onerror = function (error) {
  //   // alert(`[error] ${error.message}`)
  // }

  // let id = 0
  function handleConnection (keyword) {
    if (!isNaN(keyword)) {
      // connect
      // id = keyword
      socket.send(keyword)
    } else if (keyword === 'host') {
      socket.send('host')
    } else if (keyword === 'pause') {
      socket.send('pause')
      pause()
    } else if (keyword === 'play') {
      socket.send('play')
      play()
    } else if (keyword === 'dc') {
      socket.close()
    }
  }

  function pause () {
    const videos = document.getElementsByTagName('video')
    videos[0].pause()
  }

  function play () {
    const videos = document.getElementsByTagName('video')
    videos[0].play()
  }

  browser.runtime.onMessage.addListener((message) => {
    const msg = message.command
    handleConnection(msg)
  })
})()
