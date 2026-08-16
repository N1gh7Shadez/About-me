/**
 * show bottom toast
 * @param {string} msg 
 */
const showToast = (msg) => {
    const t = document.createElement('div')
    t.className = 'toast'
    t.textContent = msg
    document.body.appendChild(t)
    requestAnimationFrame(() => t.classList.add('show'))
    setTimeout(() => {
        t.classList.remove('show')
        setTimeout(() => t.remove(), 300)
    }, 2000)
}

/**
 * copy textarea modal
 * @param {string} text 
 */
const showModal = (text) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay show'
    const box = document.createElement('div')
    box.className = 'modal-content'

    const header = document.createElement('div')
    header.className = 'modal-header'
    const title = document.createElement('div')
    title.className = 'modal-title'
    title.textContent = 'Copy Manually'
    const close = document.createElement('button')
    close.className = 'modal-close'
    close.innerHTML = '&times;'
    close.onclick = () => overlay.remove()
    header.append(title, close)

    const ta = document.createElement('textarea')
    ta.className = 'modal-textarea'
    ta.value = text

    const btn = document.createElement('button')
    btn.className = 'modal-btn'
    btn.textContent = 'Close'
    btn.onclick = () => overlay.remove()

    box.append(header, ta, btn)
    overlay.appendChild(box)
    document.body.appendChild(overlay)
    ta.select()
}

/** @parm {number} n */
function formatInt(n = 0) {
    n = Number(n) || 0
    if (n < 1e3) return /**/n
    if (n < 1e4) return /**/(n / 1e3).toFixed(1) + 'K'   // 1.2K
    if (n < 1e5) return /* */Math.floor(n / 1e3) + 'K'   // 12K
    if (n < 1e6) return /* */Math.floor(n / 1e3) + 'K'   // 123K
    if (n < 1e7) return /**/(n / 1e6).toFixed(1) + 'M'   // 1.2M
    if (n < 1e8) return /* */Math.floor(n / 1e6) + 'M'   // 12M
    return Math.floor(n / 1e6) + 'M'                     // 123M+
}

/**
 * show confrim modal
 * @param {string} msg @param {Function} onYes
 */
const showConfirm = (msg, onYes) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay show'

    const box = document.createElement('div')
    box.className = 'modal-content'

    const header = document.createElement('div')
    header.className = 'modal-header'
    const title = document.createElement('div')
    title.className = 'modal-title'
    title.textContent = 'Confirm Leave?'
    const close = document.createElement('button')
    close.className = 'modal-close'
    close.innerHTML = '&times;'
    close.onclick = () => overlay.remove()
    header.append(title, close)

    const body = document.createElement('div')
    body.className = 'modal-body'
    body.textContent = msg

    const btns = document.createElement('div')
    btns.className = 'modal-buttons'

    const yes = document.createElement('button')
    yes.className = 'modal-btn'
    yes.textContent = 'Continue'
    yes.onclick = () => {
        overlay.remove()
        onYes()
    }

    const no = document.createElement('button')
    no.className = 'modal-btn cancel'
    no.textContent = 'Cancel'
    no.onclick = () => overlay.remove()

    btns.append(no, yes)
    box.append(header, body, btns)
    overlay.appendChild(box)
    document.body.appendChild(overlay)
}

