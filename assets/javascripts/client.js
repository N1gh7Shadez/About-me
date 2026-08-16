const countEl = document.getElementById('followerCount')

const preventDrag = element => {
    element.draggable = false
    element.ondragstart = () => false
}

async function getCount() {
    if (!countEl) return

    const response = await fetch('https://n1gh7shadez.aitji.xyz/api/visit')
    const data = await response.json()
    countEl.textContent = formatInt(data.count)
    localStorage.setItem('last-count', data.count)
}

async function addVisit() {
    if (!countEl) return

    const response = await fetch('https://n1gh7shadez.aitji.xyz/api/visit', { method: 'POST' })
    const data = await response.json()
    countEl.textContent = formatInt(data.count)
    localStorage.setItem('last-count', data.count)
}

const initDashboard = () => {
    const isLowEndDevice = () => navigator.hardwareConcurrency <= 2
        || navigator.deviceMemory <= 4
        || /Android.*Chrome\/[0-5]/.test(navigator.userAgent)

    if (isLowEndDevice()) {
        document.documentElement.style.setProperty('--animation-duration', '0.5s')
        document.documentElement.style.setProperty('--transition-duration', '0.2s')
    }

    const dashboard = new RPCDashboard()
    const gamesGrid = document.getElementById('gamesGrid')
    const gamesScroll = new InfiniteScroll(gamesGrid)

    window.addEventListener('beforeunload', () => {
        dashboard.destroy()
        gamesScroll.stopAutoScroll()
    })

    window.setInterval(getCount, 16_000)
}

document.addEventListener('DOMContentLoaded', () => {
    countEl.textContent = formatInt(localStorage.getItem('last-count') || '0')
    initDashboard()
    addVisit()
})

document.querySelectorAll('img, a').forEach(preventDrag)
new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'IMG' || node.tagName === 'A') preventDrag(node)
            if (node.querySelectorAll) node.querySelectorAll('img, a').forEach(preventDrag)
        })
    })
}).observe(document.body, { childList: true, subtree: true })

document.addEventListener('click', async event => {
    const anchor = event.target.closest('a')
    if (!anchor || anchor.className !== 'game-icon') return

    const copy = anchor.getAttribute('data-copy')
    if (copy) {
        event.preventDefault()
        try {
            await navigator.clipboard.writeText(copy)
            showToast('Copied!')
        } catch {
            showModal(copy)
        }
        return
    }

    const hrefTo = anchor.getAttribute('href-to')
    if (!hrefTo) return

    event.preventDefault()
    showConfirm(`You are going to: ${hrefTo}`, () => {
        try {
            window.open(hrefTo, '_blank')
        } catch {
            window.location.href = hrefTo
        }
    })
})
