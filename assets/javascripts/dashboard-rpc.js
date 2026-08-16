class RPCDashboard extends AudioDashboard {
    startRPCLiveUpdates() {
        if (this.rpcUpdateInterval) clearInterval(this.rpcUpdateInterval)
        this.rpcUpdateInterval = setInterval(() => this.updateRPCTimestamps(), 1000)
    }

    stopRPCLiveUpdates() {
        if (this.rpcUpdateInterval) {
            clearInterval(this.rpcUpdateInterval)
            this.rpcUpdateInterval = null
        }
    }

    updateRPCTimestamps() {
        if (!this.rpcData || !this.rpcData.activities) return

        const rawActivities = this.rpcData.activities || []
        const picked = new Map()

        rawActivities.forEach((activity, index) => {
            const nameKey = (activity.name || '').toLowerCase()
            if (!nameKey) return

            const hasImage =
                (activity.large_image && activity.large_image !== 'null') ||
                (activity.small_image && activity.small_image !== 'null')

            if (!picked.has(nameKey)) {
                picked.set(nameKey, { activity, index, hasImage })
                return
            }

            const prev = picked.get(nameKey)

            if (!prev.hasImage && hasImage) {
                picked.set(nameKey, { activity, index, hasImage })
                return
            }

            if (prev.hasImage === hasImage && index < prev.index) {
                picked.set(nameKey, { activity, index, hasImage })
            }
        })

        const activities = [...picked.values()]
            .sort((a, b) => a.index - b.index)
            .map(v => v.activity)

        activities.forEach((activity, displayIndex) => {
            const activityElement = document.querySelector(`[data-activity-index="${displayIndex}"]`)
            if (!activityElement) return

            const startTime = activity.timestamps?.start && activity.timestamps.start !== "null"
                ? new Date(activity.timestamps.start)
                : null
            const endTime = activity.timestamps?.end && activity.timestamps.end !== "null"
                ? new Date(activity.timestamps.end)
                : null

            if (!startTime) return

            const currentTimeElement = activityElement.querySelector('.current-time')
            const endTimeElement = activityElement.querySelector('.end-time')
            const progressFill = activityElement.querySelector('.progress-fill')
            const progressBar = activityElement.querySelector('.progress-bar')

            const now = Date.now()
            const elapsed = Math.max(0, now - startTime.getTime())

            if (endTime) {
                const total = endTime.getTime() - startTime.getTime()
                let progress = (elapsed / total) * 100

                if (progress >= 100) progress = progress % 100

                const currentTimeText = this.formatTime(elapsed % total)
                const endTimeText = this.formatTime(total)

                if (currentTimeElement) currentTimeElement.textContent = currentTimeText
                if (endTimeElement) endTimeElement.textContent = endTimeText
                if (progressFill) progressFill.style.width = Math.min(progress, 100) + '%'

            } else {
                // count up scenario - show "Playing for X time"
                const durationText = this.formatDuration(elapsed)

                if (currentTimeElement) currentTimeElement.textContent = `Playing for ${durationText}`
                if (endTimeElement) endTimeElement.textContent = 'Live'

                // hide progress bar for count-up activities
                if (progressBar) progressBar.style.display = 'none'
            }
        })
    }

    renderSkeletonRPC() {
        const rpcContainer = document.getElementById('discordRPC')
        if (!rpcContainer) return

        rpcContainer.innerHTML = `
        <div class="rpc-header">
            <div class="rpc-avatar skeleton"></div>
            <div style="flex: 1;">
                <div class="skeleton skeleton-text" style="width: 200px;"></div>
                <div class="skeleton skeleton-text" style="width: 150px;"></div>
            </div>
        </div>
        <div class="rpc-content">
            <div class="skeleton skeleton-image"></div>
            <div style="flex: 1;">
                <div class="skeleton skeleton-text" style="width: 180px;"></div>
                <div class="skeleton skeleton-text" style="width: 220px;"></div>
                <div class="skeleton skeleton-text" style="width: 160px;"></div>
            </div>
            <div class="buttons-section">
                <div class="skeleton" style="width: 80px; height: 32px; border-radius: 5px;"></div>
                <div class="skeleton" style="width: 80px; height: 32px; border-radius: 5px;"></div>
            </div>
        </div>`
    }

    async startDiscordRPCFetching() {
        const fetchRPC = async () => {
            try {
                const response = await fetch('https://n1gh7shadez.aitji.xyz/api/dsc-status')
                const data = await response.json()

                if (data.cached && this.cacheStartTime === null) this.cacheStartTime = Date.now() - (data.cache_age * 1000)
                else if (!data.cached) this.cacheStartTime = Date.now()

                this.rpcData = data
                this.renderRPC()
                this.renderVCDisplay()

                // start live updates after rendering
                this.startRPCLiveUpdates()
            } catch (error) {
                console.error('discord rpc fetch failed:', error)
                this.renderErrorRPC()
            }
        }

        await fetchRPC()
        this.fetchInterval = setInterval(fetchRPC, 61_000) // 61s. server&browser already reset cache
    }

    renderRPC() {
        if (!this.rpcData) return

        const rpcContainer = document.getElementById('discordRPC')
        const statusDot = document.getElementById('statusDot')

        if (!rpcContainer) return
        if (statusDot) statusDot.className = `status-dot ${this.rpcData.status || 'offline'}`

        const rawActivities = this.rpcData.activities || []
        if (!rawActivities.length) {
            rpcContainer.innerHTML = ''
            rpcContainer.style.display = 'none'
            this.stopRPCLiveUpdates()
            return
        } else rpcContainer.style.display = 'block'

        const picked = new Map()

        rawActivities.forEach((activity, index) => {
            const nameKey = (activity.name || '').toLowerCase()
            if (!nameKey) return

            const hasImage =
                (activity.large_image && activity.large_image !== 'null') ||
                (activity.small_image && activity.small_image !== 'null')

            if (!picked.has(nameKey)) {
                picked.set(nameKey, { activity, index, hasImage })
                return
            }

            const prev = picked.get(nameKey)

            if (!prev.hasImage && hasImage) {
                picked.set(nameKey, { activity, index, hasImage })
                return
            }

            if (prev.hasImage === hasImage && index < prev.index) {
                picked.set(nameKey, { activity, index, hasImage })
            }
        })

        const activities = [...picked.values()]
            .sort((a, b) => a.index - b.index)
            .map(v => v.activity)

        rpcContainer.innerHTML = activities.map((activity, index) => {
            const startTime = activity.timestamps?.start && activity.timestamps.start !== 'null'
                ? new Date(activity.timestamps.start)
                : null
            const endTime = activity.timestamps?.end && activity.timestamps.end !== 'null'
                ? new Date(activity.timestamps.end)
                : null

            let progressHtml = ''
            let currentTimeText = 'xx:xx'
            let endTimeText = 'xx:xx'

            if (startTime) {
                const now = Date.now()
                const elapsed = Math.max(0, now - startTime.getTime())

                if (endTime) {
                    // progress bar scenario
                    const total = endTime.getTime() - startTime.getTime()
                    let progress = (elapsed / total) * 100

                    // loop progress if it exceeds 100%
                    if (progress >= 100) progress = progress % 100

                    currentTimeText = this.formatTime(elapsed % total)
                    endTimeText = this.formatTime(total)

                    progressHtml = `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%;"></div>
                    </div>
                    <div class="time-stamps">
                        <span class="current-time">${currentTimeText}</span>
                        <span class="end-time">${endTimeText}</span>
                    </div>`
                } else {
                    const durationText = this.formatDuration(elapsed)

                    progressHtml = `
                    <div class="time-stamps">
                        <span class="current-time">Playing for ${durationText}</span>
                        <span class="end-time">Live</span>
                    </div>`
                }
            }

            const buttonsHtml = ''

            let imagesrc = activity.large_image || activity.small_image
            const getIcon = this.gamesIcon[activity.name.toLowerCase()]
            if (getIcon) imagesrc = "../../assets/images/games/" + getIcon

            return `
            <div class="rpc-activity" data-activity-index="${index}">
                ${index === 0 ? `
                <div class="rpc-header">
                    <img class="rpc-avatar" src="${this.rpcData.avatar || 'assets/images/N1s.jpg'}" alt="Discord Avatar">
                    <div>
                        <div class="activity-title">${this.rpcData.name}</div>
                        <div class="activity-details">${activity.state || "Sleep all the time."}</div>
                    </div>
                </div>` : `<div class="rpc-content">
                    ${imagesrc && imagesrc !== "null"
                    ? `<div class="activity-image"><img src="${imagesrc}" alt="Activity" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;"></div>`
                    : ''}
                    <div class="activity-info">
                        <div class="activity-title">${activity.name || 'Activity Title'}</div>
                        ${activity.details && activity.details !== "null"
                    ? `<div class="activity-details">${activity.details || ''}</div><div class="activity-details">${activity.state || ''}</div>`
                    : activity.state && activity.state !== "null" ? `<div class="activity-details">${activity.state || ''}</div>` : ''}
                        ${progressHtml}
                    </div>
                    ${buttonsHtml ? `<div class="buttons-section">${buttonsHtml}</div>` : ''}
                </div>`}
            </div>`
        }).join('<hr>')
    }

    renderErrorRPC() {
        const rpcContainer = document.getElementById('discordRPC')
        if (!rpcContainer) return

        // stop live updates on error
        this.stopRPCLiveUpdates()

        rpcContainer.innerHTML = `
        <div class="rpc-header">
            <div class="rpc-avatar" style="background: rgba(255, 107, 157, 0.2);"></div>
            <div>
                <div class="activity-title">Failed to load Discord RPC</div>
                <div class="activity-details">Check your connection and try again...</div>
            </div>
        </div>`
    }

    // cleanup
    destroy() {
        this.stopWaveformAnimation()
        this.stopRPCLiveUpdates() // Stop RPC live updates

        if (this.fetchInterval) clearInterval(this.fetchInterval)
        if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close()

        const extraVideos = document.querySelectorAll('video:not(.video-background)')
        extraVideos.forEach(video => {
            if (video.parentNode)
                video.parentNode.removeChild(video)
        })
    }
}

