(function () {
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  const socket = new WebSocket('ws://44.204.233.239:42069')

  socket.onmessage = function (event) {
    if (event.data === 'pause') {
      pause()
    } else if (!isNaN(event.data)) {
      alert(event.data)
    } else if (event.data === 'play') {
      play()
    }
  }

  socket.onclose = function (event) {
    if (event.wasClean) {
      // alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`)
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      // alert('[close] Connection died')
    }
  }

  socket.onerror = function (error) {
    alert(`[error] ${error.message}`)
  }

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
