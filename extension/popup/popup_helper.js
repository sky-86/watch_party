export function toggleConnect () {
  document.getElementById('guest_input').classList.remove('hidden')
  document.getElementById('modes').classList.add('hidden')
}

export function reportExecuteScriptError (error) {
  document.querySelector('#popup-content').classList.add('hidden')
  document.querySelector('#error-content').classList.remove('hidden')
  console.error(`Failed to execute watch_party content script: ${error.message}`)
}

export function becomeHost (id) {
  document.getElementById('host_id').innerHTML = id
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('guest').classList.add('hidden')
  document.getElementById('host').classList.remove('hidden')
  document.getElementById('disconnect').classList.remove('hidden')
  document.getElementById('guest_input').classList.add('hidden')
}

export function becomeGuest () {
  document.getElementById('modes').classList.add('hidden')
  document.getElementById('host').classList.add('hidden')
  document.getElementById('guest').classList.remove('hidden')
  document.getElementById('disconnect').classList.remove('hidden')
  document.getElementById('guest_input').classList.add('hidden')
}

export function reset () {
  document.getElementById('modes').classList.remove('hidden')
  document.getElementById('host').classList.add('hidden')
  document.getElementById('guest').classList.add('hidden')
  document.getElementById('disconnect').classList.add('hidden')
  document.getElementById('guest_input').classList.add('hidden')
}
