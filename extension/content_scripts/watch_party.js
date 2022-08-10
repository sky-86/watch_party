(function () {
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  let video = document.getElementsByTagName('video')[0]
  video.pause()
  video.currentTime = 0.0

  let clientType = ''

  const videoState = {
    url: document.URL,
    time: video.currentTime,
    paused: true,
    buffering: false
  }

  // add function that waits to open socket until the user presses host or connect
  function openSocket () {
    // return new WebSocket('ws://44.204.233.239:42069')
    return new WebSocket('ws://localhost:42069')
  }

  const socket = openSocket()

  function handleConnection (keyword) {
    if (keyword === 'host') {
      clientType = 'host'
      socket.send(keyword)
      socket.send(JSON.stringify(videoState))
    } else if (!isNaN(keyword)) {
      clientType = 'guest'
      socket.send('guest')
      socket.send(keyword)
    } else if (keyword === 'dc') {
      socket.close()
      // socket = openSocket()
    } else if (keyword === 'play') {
      alert('play')
      play()
      socket.send('play')
    } else if (keyword === 'pause') {
      alert('pause')
      pause()
      socket.send('pause')
    }
  }

  socket.onmessage = function (event) {
    const data = event.data

    if (clientType === 'host') {
      if (!isNaN(data)) {
        browser.runtime.sendMessage({ hostId: data })
      }
    } else if (clientType === 'guest') {
      if (data === 'play') {
        alert('play')
        play()
      } else if (data === 'pause') {
        alert('pause')
        pause()
      } else {
        const state = JSON.parse(data)
        location.href = state.url
      }
    }

    // if (event.data === 'pause') {
    //   pause()
    // } else if (!isNaN(event.data)) {
    //   browser.runtime.sendMessage({ hostId: event.data })
    // } else if (event.data === 'play') {
    //   play()
    // }
  }

  /*
    if (!isNaN(keyword)) {
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
    */

  socket.onerror = function (error) {
    alert(`[error] ${error.message}`)
  }

  function pause () {
    video = document.getElementsByTagName('video')[0]
    video.pause()
  }

  function play () {
    video = document.getElementsByTagName('video')[0]
    video.play()
  }

  browser.runtime.onMessage.addListener((message) => {
    const msg = message.command
    handleConnection(msg)
  })
})()
