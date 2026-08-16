class InfiniteScroll {
    constructor(container) {
        this.container = container
        this.originalItems = []
        this.track = null
        this.isInfiniteMode = false
        this.isAutoScrolling = false
        this.isInteracting = false
        this.itemWidth = 0
        this.scrollThreshold = 100
        this.autoScrollSpeed = 10
        this.idleDelay = 15_000
        this.duplicateSets = 4
        this.resumeTimer = null

        if (!this.container) return

        this.handleResize = () => this.checkScreenSize()
        this.handleContainerScroll = () => this.handleScroll()
        this.handleInteractionStart = () => this.pauseForInteraction(true)
        this.handleInteractionMove = () => this.pauseForInteraction(true)
        this.handleInteractionEnd = () => this.endInteraction()
        this.handleWheel = () => this.pauseForInteraction(false)
        this.handleVisibilityChange = () => this.syncVisibility()

        this.init()
    }

    init() {
        this.originalItems = Array.from(this.container.children)
        this.bindEvents()
        this.checkScreenSize()
    }

    bindEvents() {
        window.addEventListener('resize', this.handleResize)
        document.addEventListener('visibilitychange', this.handleVisibilityChange)
        this.container.addEventListener('scroll', this.handleContainerScroll)
        this.container.addEventListener('pointerdown', this.handleInteractionStart, { passive: true })
        this.container.addEventListener('pointermove', this.handleInteractionMove, { passive: true })
        this.container.addEventListener('pointerup', this.handleInteractionEnd, { passive: true })
        this.container.addEventListener('pointercancel', this.handleInteractionEnd, { passive: true })
        this.container.addEventListener('touchstart', this.handleInteractionStart, { passive: true })
        this.container.addEventListener('touchmove', this.handleInteractionMove, { passive: true })
        this.container.addEventListener('touchend', this.handleInteractionEnd, { passive: true })
        this.container.addEventListener('touchcancel', this.handleInteractionEnd, { passive: true })
        this.container.addEventListener('wheel', this.handleWheel, { passive: true })
    }

    checkScreenSize() {
        const shouldBeInfinite = window.innerWidth <= 748

        if (shouldBeInfinite && !this.isInfiniteMode) this.enableInfiniteScroll()
        else if (!shouldBeInfinite && this.isInfiniteMode) this.disableInfiniteScroll()
    }

    enableInfiniteScroll() {
        this.isInfiniteMode = true
        this.track = document.createElement('div')
        this.track.className = 'games-grid-track'

        for (let set = 0; set < this.duplicateSets; set++) {
            this.originalItems.forEach(item => this.track.appendChild(item.cloneNode(true)))
        }

        this.container.innerHTML = ''
        this.container.appendChild(this.track)

        const firstSetStart = this.track.children[0].offsetLeft
        const secondSetStart = this.track.children[this.originalItems.length].offsetLeft
        this.itemWidth = secondSetStart - firstSetStart

        this.container.scrollLeft = 0
        this.startAutoScroll()
    }

    disableInfiniteScroll() {
        this.isInfiniteMode = false
        this.isInteracting = false
        this.stopAutoScroll()
        this.clearResumeTimer()
        this.container.innerHTML = ''
        this.originalItems.forEach(item => this.container.appendChild(item))
        this.container.scrollLeft = 0
        this.track = null
    }

    pauseForInteraction(holdUntilEnd) {
        if (!this.isInfiniteMode) return

        this.isInteracting = holdUntilEnd
        this.stopAutoScroll()
        this.clearResumeTimer()

        if (!holdUntilEnd) this.scheduleResume()
    }

    endInteraction() {
        if (!this.isInfiniteMode) return

        this.isInteracting = false
        this.scheduleResume()
    }

    scheduleResume(delay = this.idleDelay) {
        this.clearResumeTimer()
        this.resumeTimer = window.setTimeout(() => {
            if (!this.isInteracting && !document.hidden) this.startAutoScroll()
        }, delay)
    }

    clearResumeTimer() {
        if (this.resumeTimer) window.clearTimeout(this.resumeTimer)
        this.resumeTimer = null
    }

    normalizePosition(position) {
        if (!this.itemWidth) return 0

        const phase = ((position % this.itemWidth) + this.itemWidth) % this.itemWidth
        return this.itemWidth + phase
    }

    getTrackPosition() {
        if (!this.track) return this.container.scrollLeft

        const transform = getComputedStyle(this.track).transform
        if (!transform || transform === 'none') return this.container.scrollLeft

        try {
            const matrix = new DOMMatrixReadOnly(transform)
            return this.container.scrollLeft - matrix.m41
        } catch {
            const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)
            if (!values) return this.container.scrollLeft

            const parts = values[1].split(',').map(Number)
            const translateX = parts.length === 16 ? parts[12] : parts[4]
            return this.container.scrollLeft - (translateX || 0)
        }
    }

    startAutoScroll() {
        if (!this.track || !this.isInfiniteMode || this.isInteracting || document.hidden) return

        this.clearResumeTimer()
        const startPosition = this.normalizePosition(this.getTrackPosition())
        const endPosition = startPosition + this.itemWidth
        const duration = this.itemWidth / this.autoScrollSpeed

        this.container.classList.remove('is-auto-scrolling')
        this.container.style.setProperty('--games-scroll-start', `${-startPosition}px`)
        this.container.style.setProperty('--games-scroll-end', `${-endPosition}px`)
        this.container.style.setProperty('--games-scroll-duration', `${duration}s`)
        this.container.scrollLeft = 0
        void this.track.offsetWidth
        this.container.classList.add('is-auto-scrolling')
        this.isAutoScrolling = true
    }

    stopAutoScroll() {
        if (!this.track || !this.isAutoScrolling) return

        const position = this.normalizePosition(this.getTrackPosition())
        this.container.classList.remove('is-auto-scrolling')
        this.container.scrollLeft = position
        this.isAutoScrolling = false
    }

    syncVisibility() {
        if (document.hidden) this.stopAutoScroll()
        else if (this.isInfiniteMode && !this.isInteracting) this.startAutoScroll()
    }

    handleScroll() {
        if (!this.isInfiniteMode || this.isAutoScrolling || !this.itemWidth) return

        const scrollLeft = this.container.scrollLeft
        const maxScroll = this.container.scrollWidth - this.container.clientWidth

        if (scrollLeft < this.scrollThreshold) {
            this.container.scrollLeft = scrollLeft + this.itemWidth
        } else if (scrollLeft > maxScroll - this.scrollThreshold) {
            this.container.scrollLeft = scrollLeft - this.itemWidth
        }
    }
}
