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

class DiscordDashboard {
    constructor() {
        this.games = [
            // add more game this is place holder
            { name: 'Youtube', url: 'https://www.youtube.com/@n1ghtshadez?sub_confirmation=1', img: "../../assets/images/Youtube.png" },
            { name: 'Facebook', url: 'https://www.facebook.com/N1gh7Shadez', img: "../../assets/images/Facebook.png" },
            { name: 'Instagram', url: 'https://www.instagram.com/_n1ghtshade_/profilecard', img: "../../assets/images/Instagram.png" },
            { name: 'Tiktok', url: 'https://www.tiktok.com/@n1gh7shadez', img: "../../assets/images/Tiktok.png" },
            { name: 'Twitch', url: 'https://www.twitch.tv/n1gh7shadez', img: "../../assets/images/Twitch.png" },
            { name: 'Spotify', url: 'https://open.spotify.com/user/ibpz1xtf2pj9a7anrvnft1ygl', img: "../../assets/images/Spotify.png" },
            { name: 'Discord', url: 'https://discord.com/invite/JZVN5h8Nqw', img: "../../assets/images/Discord.png" },
            { name: 'Roblox', url: 'https://www.roblox.com/users/1207490727/profile', img: "../../assets/images/Roblox.png" },
            { name: 'Riot', url: 'N1gh7Shadez#17250', img: "../../assets/images/Riot.png" },
            { name: 'RoV', url: 'N1gh7Shadez', img: "../../assets/images/RoV.png" },
            { name: 'LINE Rangers', url: '308c37e3', img: "../../assets/images/LINERangers.png" },
        ]

        this.gamesIcon = {
            // <aitji> this will get file from "assets/images/games/..."
            // kept it lowercase for game name
            'minecraft': 'Minecraft.png',
            'valorant': 'Valorant.png',    // <aitji> i don't have valorant icon : use file from images
            'roblox': '../Roblox.png',
            'hollow knight: silksong': 'HollowKnight.png',
        }

        this.rpcData = null
        this.fetchInterval = null
        this.cacheStartTime = null
        this.rpcUpdateInterval = null
        this.videoSources = [
            'assets/videos/wpp.mp4',
            'assets/videos/wpp-ios.mp4',
            'assets/videos/wpp-mobile.mp4'
        ]

        // audio analysis properties
        this.audioContext = null
        this.analyser = null
        this.dataArray = null
        this.waveAnimation = null
        this.waveBars = []
        this.staticWaveform = []

        this.init()
    }

    init() {
        this.setupVideoBackground()
        this.renderGames()
        this.createWaveform()
        this.setupAudioControls()
        this.setupVCModal()
        this.startDiscordRPCFetching()
        this.renderSkeletonRPC()
    }

    // video bg setup
    setupVideoBackground() {
        const video = document.querySelector('.video-background')
        if (!video) return

        this.loadVideo(0)
            .then(({ src }) => {
                video.src = src
                video.load()

                const handleReady = () => {
                    video.removeEventListener('canplaythrough', handleReady)
                    video.play().then(() => {
                        video.classList.add('loaded')
                    }).catch(() => {
                        video.classList.add('loaded')
                    })
                }

                if (video.readyState >= 3) {
                    handleReady()
                } else {
                    video.addEventListener('canplaythrough', handleReady, { once: true })
                }

                this.upgradeVideoQuality(video, 1)
            })
            .catch(() => {
                video.style.display = 'none'
            })
    }

    loadVideo(index) {
        return new Promise((resolve, reject) => {
            if (index >= this.videoSources.length) {
                reject(new Error('no more video sources'))
                return
            }

            const testVideo = document.createElement('video')
            testVideo.preload = 'auto'
            testVideo.muted = true

            const handleSuccess = () => {
                testVideo.removeEventListener('canplaythrough', handleSuccess)
                testVideo.removeEventListener('error', handleError)
                resolve({ src: this.videoSources[index] })
            }

            const handleError = () => {
                testVideo.removeEventListener('canplaythrough', handleSuccess)
                testVideo.removeEventListener('error', handleError)
                this.loadVideo(index + 1).then(resolve).catch(reject)
            }

            testVideo.addEventListener('canplaythrough', handleSuccess, { once: true })
            testVideo.addEventListener('error', handleError, { once: true })
            testVideo.src = this.videoSources[index]
            testVideo.load()
        })
    }

    upgradeVideoQuality(mainVideo, startIndex) {
        if (startIndex >= this.videoSources.length) return

        setTimeout(() => {
            this.tryVideoUpgrade(mainVideo, startIndex)
        }, 3000)
    }

    tryVideoUpgrade(mainVideo, index) {
        if (index >= this.videoSources.length) return

        const upgradeVideo = document.createElement('video')
        upgradeVideo.preload = 'auto'
        upgradeVideo.muted = true
        upgradeVideo.loop = true
        upgradeVideo.playsInline = true
        upgradeVideo.style.display = 'none'
        document.body.appendChild(upgradeVideo)

        const handleReady = () => {
            upgradeVideo.currentTime = mainVideo.currentTime
            upgradeVideo.play().then(() => {
                mainVideo.src = this.videoSources[index]
                mainVideo.load()

                const handleMainReady = () => {
                    mainVideo.currentTime = upgradeVideo.currentTime
                    mainVideo.play().then(() => {
                        upgradeVideo.remove()
                        this.upgradeVideoQuality(mainVideo, index + 1)
                    })
                }
                mainVideo.addEventListener('canplaythrough', handleMainReady, { once: true })
            }).catch(() => {
                upgradeVideo.remove()
                this.tryVideoUpgrade(mainVideo, index + 1)
            })
        }

        upgradeVideo.addEventListener('canplaythrough', handleReady, { once: true })
        upgradeVideo.addEventListener('error', () => {
            upgradeVideo.remove()
            this.tryVideoUpgrade(mainVideo, index + 1)
        }, { once: true })

        upgradeVideo.src = this.videoSources[index]
        upgradeVideo.load()
    }

    // games grid rendering
    renderGames() {
        const gamesGrid = document.getElementById('gamesGrid')
        if (!gamesGrid) return

        gamesGrid.innerHTML = ''

        this.games.forEach(game => {
            const container = document.createElement('div')
            container.style.position = 'relative'

            const a = document.createElement('a')
            a.className = 'game-icon'
            a.title = game.name

            if (game.url.startsWith('http')) {
                a.href = "#"
                // a.target = '_blank'
                a.setAttribute('href-to', game.url)
            } else {
                // treat as copy-text
                a.href = '#'
                a.setAttribute('data-copy', game.url)
            }

            if (game.img) {
                const img = document.createElement('img')
                img.src = game.img
                img.alt = game.name
                a.appendChild(img)
            } else {
                a.textContent = game.name
            }

            container.appendChild(a)
            gamesGrid.appendChild(container)
        })
    }

    renderVCDisplay() {
        const vcDisplay = document.getElementById('vcDisplay')

        if (!vcDisplay) return
        vcDisplay.innerHTML = ''

        // user in vc?
        if (!this.rpcData || !this.rpcData.vc_channel || !this.rpcData.vc_channel.members) {
            vcDisplay.style.display = 'none'
            return
        }

        vcDisplay.style.display = 'flex'
        const members = this.rpcData.vc_channel.members
        const maxVisible = 5

        // show up to 5 members
        const visibleMembers = members.slice(0, maxVisible)

        visibleMembers.forEach(member => {
            const memberEl = document.createElement('div')
            memberEl.className = 'vc-member'

            const avatar = document.createElement('img')
            avatar.className = 'vc-avatar'
            avatar.src = member.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
            avatar.alt = member.display_name
            avatar.onerror = () => avatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png'

            const tooltip = document.createElement('div')
            tooltip.className = 'tooltip'
            tooltip.textContent = member.display_name

            memberEl.appendChild(avatar)
            memberEl.appendChild(tooltip)
            memberEl.onclick = () => this.showVCModal()
            vcDisplay.appendChild(memberEl)
        })

        // overflow indicator if more than 5 members
        if (members.length > maxVisible) {
            const container = document.createElement('div')
            container.className = 'vc-member'

            const overflowEl = document.createElement('div')
            overflowEl.className = 'vc-overflow'
            overflowEl.textContent = `+${members.length - maxVisible}`
            overflowEl.onclick = () => this.showVCModal()

            const tooltip = document.createElement('div')
            tooltip.className = 'tooltip'
            tooltip.textContent = 'View all members'

            container.appendChild(overflowEl)
            container.appendChild(tooltip)
            vcDisplay.appendChild(container)
        }
    }

    setupVCModal() {
        const modal = document.getElementById('vcModal')
        const closeBtn = document.getElementById('modalClose')

        if (closeBtn) closeBtn.onclick = () => this.hideVCModal()

        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideVCModal()
                }
            }
        }

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case "Escape": this.hideVCModal(); break
                case "Spacebar": this.hideVCModal(); break
                case "Enter": this.hideVCModal(); break
                case "Backspace": this.hideVCModal(); break
                default: break
            }
        })
    }

    showVCModal() {
        const modal = document.getElementById('vcModal')
        const guildInfo = document.getElementById('guildInfo')
        const memberList = document.getElementById('memberList')

        if (!modal || !this.rpcData || !this.rpcData.vc_channel) return
        if (guildInfo) guildInfo.innerHTML = `${this.rpcData.vc_channel.guild}<br><strong>${this.rpcData.vc_channel.channel}</strong>`

        // populate member list
        if (memberList) {
            memberList.innerHTML = ''

            this.rpcData.vc_channel.members.forEach(member => {
                const memberItem = document.createElement('div')
                memberItem.className = 'member-item'

                const avatar = document.createElement('img')
                avatar.className = 'member-avatar'
                avatar.src = member.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
                avatar.alt = member.display_name
                avatar.onerror = () => avatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png'

                const memberInfo = document.createElement('div')
                memberInfo.className = 'member-info'

                const memberName = document.createElement('div')
                memberName.className = 'member-name'
                memberName.textContent = member.display_name

                const memberUsername = document.createElement('div')
                memberUsername.className = 'member-username'
                memberUsername.textContent = member.name

                memberInfo.appendChild(memberName)
                memberInfo.appendChild(memberUsername)
                memberItem.appendChild(avatar)
                memberItem.appendChild(memberInfo)

                memberList.appendChild(memberItem)
            })
        }

        modal.classList.add('show')
        document.body.style.overflow = 'hidden'
    }

    hideVCModal() {
        const modal = document.getElementById('vcModal')
        if (modal) {
            modal.classList.remove('show')
            document.body.style.overflow = ''
        }
    }

    // waveform creation and analysis
    async createWaveform() {
        const waveform = document.getElementById('waveform')
        if (!waveform) return

        const bars = 30
        waveform.innerHTML = ''

        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div')
            bar.className = 'wave-bar'
            bar.style.height = '5px'
            bar.dataset.index = i
            waveform.appendChild(bar)
        }

        this.waveBars = document.querySelectorAll('.wave-bar')
        await this.generateStaticWaveform()
    }

    // analyze audio file to create static waveform
    async generateStaticWaveform() {
        try {
            const audio = document.getElementById('favAudio')
            if (!audio || !audio.src) return

            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const response = await fetch(audio.src)
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            const channelData = audioBuffer.getChannelData(0)
            const samples = channelData.length
            const blockSize = Math.floor(samples / this.waveBars.length)

            this.staticWaveform = []

            // calculate rms for each block
            for (let i = 0; i < this.waveBars.length; i++) {
                const start = i * blockSize
                const end = start + blockSize
                let sum = 0

                for (let j = start; j < end && j < samples; j++) sum += channelData[j] * channelData[j]

                const rms = Math.sqrt(sum / blockSize)
                const height = Math.max(5, Math.min(rms * 150, 35))
                this.staticWaveform.push(height)
            }

            this.updateStaticWaveform()
            await audioContext.close()

        } catch (error) { this.generateFallbackWaveform() }
    }

    generateFallbackWaveform() {
        this.staticWaveform = []
        for (let i = 0; i < this.waveBars.length; i++) this.staticWaveform.push(Math.random() * 30 + 5)
        this.updateStaticWaveform()
    }

    updateStaticWaveform() {
        this.staticWaveform.forEach((height, index) => {
            if (this.waveBars[index])
                this.waveBars[index].style.height = height + 'px'
        })
    }

    // setup real-time frequency analysis
    async setupRealtimeWaveform(audio) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            this.analyser = this.audioContext.createAnalyser()

            const source = this.audioContext.createMediaElementSource(audio)
            source.connect(this.analyser)
            this.analyser.connect(this.audioContext.destination)

            this.analyser.fftSize = 64
            const bufferLength = this.analyser.frequencyBinCount
            this.dataArray = new Uint8Array(bufferLength)

        } catch (error) { console.warn('realtime waveform setup failed') }
    }

    animateWaveform() {
        if (this.waveAnimation) {
            if (typeof this.waveAnimation === 'number') clearInterval(this.waveAnimation)
            else cancelAnimationFrame(this.waveAnimation)
        }

        if (this.analyser && this.dataArray) this.animateRealtimeWaveform()
        else this.animateSimulatedWaveform()
    }

    animateRealtimeWaveform() {
        const updateWaveform = () => {
            if (!this.analyser || !this.dataArray) return

            this.analyser.getByteFrequencyData(this.dataArray)
            this.waveBars.forEach((bar, index) => {
                const dataIndex = Math.floor((index / this.waveBars.length) * this.dataArray.length)
                const value = this.dataArray[dataIndex]
                const height = Math.max(5, (value / 255) * 35 + 5)

                bar.style.height = height + 'px'

                if (value > 10) bar.classList.add('active')
                else bar.classList.remove('active')
            })

            this.waveAnimation = requestAnimationFrame(updateWaveform)
        }

        updateWaveform()
    }

    animateSimulatedWaveform() {
        if (!this.staticWaveform.length) return

        let currentBar = 0
        const intervalId = setInterval(() => {
            this.waveBars.forEach((bar, index) => {
                bar.classList.remove('active')
                bar.style.height = this.staticWaveform[index] + 'px'
            })

            // animate current section with boosted heights
            for (let i = 0; i < 4; i++) {
                const barIndex = (currentBar + i) % this.waveBars.length
                const bar = this.waveBars[barIndex]
                if (bar) {
                    bar.classList.add('active')
                    const baseHeight = this.staticWaveform[barIndex] || 10
                    const boostedHeight = Math.min(baseHeight * 1.8, 40)
                    bar.style.height = boostedHeight + 'px'
                }
            }

            currentBar = (currentBar + 1) % this.waveBars.length
        }, 150)

        this.waveAnimation = intervalId
    }

    stopWaveformAnimation() {
        if (this.waveAnimation) {
            if (typeof this.waveAnimation === 'number') clearInterval(this.waveAnimation)
            else cancelAnimationFrame(this.waveAnimation)

            this.waveAnimation = null
        }

        this.waveBars.forEach((bar, index) => {
            bar.classList.remove('active')
            if (this.staticWaveform[index]) bar.style.height = this.staticWaveform[index] + 'px'
        })
    }

    // audio player controls
    async setupAudioControls() {
        const audio = document.getElementById('favAudio')
        const playButton = document.getElementById('playButton')
        const progress = document.getElementById('audioProgress')
        const progressBar = document.getElementById('progressBar')
        const currentTime = document.getElementById('currentTime')
        const totalTime = document.getElementById('totalTime')

        if (!audio || !playButton) return

        let isPlaying = false
        audio.volume = 0.05
        playButton.innerHTML = '<i class="fas fa-play"></i>'

        playButton.addEventListener('click', async () => {
            if (isPlaying) {
                audio.pause()
                playButton.innerHTML = '<i class="fas fa-play"></i>'
                this.stopWaveformAnimation()
            } else {
                try {
                    if (!this.audioContext) await this.setupRealtimeWaveform(audio)
                    if (this.audioContext && this.audioContext.state === 'suspended') await this.audioContext.resume()

                    await audio.play()
                    playButton.innerHTML = '<i class="fas fa-pause"></i>'
                    this.animateWaveform()
                } catch (e) {
                    playButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
                    setTimeout(() => playButton.innerHTML = '<i class="fas fa-play"></i>', 2000)
                }
            }
            isPlaying = !isPlaying
        })

        audio.addEventListener('loadedmetadata', () => {
            if (totalTime && !isNaN(audio.duration))
                totalTime.textContent = this.formatTime(audio.duration * 1000)
        })

        audio.addEventListener('timeupdate', () => {
            if (audio.duration && !isNaN(audio.duration)) {
                const progressPercent = (audio.currentTime / audio.duration) * 100

                if (progress) progress.style.width = Math.min(progressPercent, 100) + '%'
                if (currentTime) currentTime.textContent = this.formatTime(audio.currentTime * 1000)
            }
        })

        audio.addEventListener('ended', () => {
            playButton.innerHTML = '<i class="fas fa-play"></i>'
            isPlaying = false
            this.stopWaveformAnimation()

            if (progress) progress.style.width = '0%'
            if (currentTime) currentTime.textContent = '0:00'
        })

        audio.addEventListener('error', () => {
            playButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
            isPlaying = false
            this.stopWaveformAnimation()
            setTimeout(() => playButton.innerHTML = '<i class="fas fa-play"></i>', 2000)
        })

        // seek functionality
        const targetElement = progressBar || (progress ? progress.parentElement : null)
        if (targetElement) {
            const handleSeek = (clientX) => {
                if (audio.duration && !isNaN(audio.duration)) {
                    const rect = targetElement.getBoundingClientRect()
                    const percent = (clientX - rect.left) / rect.width
                    audio.currentTime = Math.max(0, Math.min(percent * audio.duration, audio.duration))
                }
            }

            targetElement.addEventListener('click', (e) => handleSeek(e.clientX))

            targetElement.addEventListener('touchend', (e) => {
                e.preventDefault()
                if (e.changedTouches.length > 0) handleSeek(e.changedTouches[0].clientX)
            })
        }
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000)
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    formatDuration(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds.toString().padStart(2, '0')} second${seconds !== 1 ? 's' : ''}`
        else if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds.toString().padStart(2, '0')} second${seconds !== 1 ? 's' : ''}`
        else return `${seconds} second${seconds !== 1 ? 's' : ''}`
    }

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

        this.rpcData.activities.forEach((activity, index) => {
            const activityElement = document.querySelector(`[data-activity-index="${index}"]`)
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

                if (currentTimeElement) currentTimeElement.textContent = durationText
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
                const response = await fetch('https://n1gh7shadez.vercel.app/api/dsc-status')
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

        const activities = this.rpcData.activities || []
        if (!activities.length) {
            rpcContainer.innerHTML = ''
            rpcContainer.style.display = 'none'
            this.stopRPCLiveUpdates()
            return
        } else rpcContainer.style.display = 'block'

        rpcContainer.innerHTML = activities.map((activity, index) => {
            const startTime = activity.timestamps?.start && activity.timestamps.start !== "null"
                ? new Date(activity.timestamps.start)
                : null
            const endTime = activity.timestamps?.end && activity.timestamps.end !== "null"
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
                        <div class="activity-details">Status: ${this.rpcData.status || 'offline'}</div>
                    </div>
                </div>` : ''}

                <div class="rpc-content">
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
                </div>
            </div><br>`
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

class InfiniteScroll {
    constructor(container) {
        this.container = container
        this.originalItems = []
        this.isInfiniteMode = false
        this.scrollThreshold = 100

        this.init()
        this.bindEvents()
    }

    init() {
        this.originalItems = Array.from(this.container.children)
        this.checkScreenSize()
    }

    bindEvents() {
        window.addEventListener('resize', () => this.checkScreenSize())
        this.container.addEventListener('scroll', () => this.handleScroll())
    }

    checkScreenSize() {
        const shouldBeInfinite = window.innerWidth <= 748;

        if (shouldBeInfinite && !this.isInfiniteMode) this.enableInfiniteScroll();
        else if (!shouldBeInfinite && this.isInfiniteMode) this.disableInfiniteScroll()
    }

    enableInfiniteScroll() {
        this.isInfiniteMode = true
        this.container.innerHTML = ''

        const fragment = document.createDocumentFragment()

        for (let i = 0; i < 3; i++) this.originalItems.forEach(item => {
            const clone = item.cloneNode(true)
            fragment.appendChild(clone)
        })

        this.container.appendChild(fragment)
        this.itemWidth = this.originalItems.length * (48 + 8)
        this.totalWidth = this.itemWidth * 3

        this.container.scrollLeft = this.itemWidth
    }

    disableInfiniteScroll() {
        this.isInfiniteMode = false

        this.container.innerHTML = ''
        this.originalItems.forEach(item => this.container.appendChild(item))
    }

    handleScroll() {
        if (!this.isInfiniteMode) return

        const scrollLeft = this.container.scrollLeft
        const maxScroll = this.container.scrollWidth - this.container.clientWidth

        if (scrollLeft < this.scrollThreshold) this.container.scrollLeft = scrollLeft + this.itemWidth
        else if (scrollLeft > maxScroll - this.scrollThreshold) this.container.scrollLeft = scrollLeft - this.itemWidth
    }
}

// DOM elements
const countEl = document.getElementById('followerCount')
const btn = document.getElementById('visitBtn')

const preventDrag = el => {
    el.draggable = false
    el.ondragstart = () => false
}

// GET
async function getCount() {
    if (!countEl) return
    const res = await fetch('https://n1gh7shadez.vercel.app/api/visit')
    const data = await res.json()
    countEl.textContent = `${formatInt(data.count)}`
    localStorage.setItem('last-count', data.count)
}

// POST
async function addVisit() {
    if (!countEl) return
    const res = await fetch('https://n1gh7shadez.vercel.app/api/visit', { method: 'POST' })
    const data = await res.json()
    countEl.textContent = `${formatInt(data.count)}`
    localStorage.setItem('last-count', data.count)
}

// initialization
const initDashboard = () => {
    const isLowEndDevice = () => navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 4 || /Android.*Chrome\/[0-5]/.test(navigator.userAgent)

    if (isLowEndDevice()) {
        document.documentElement.style.setProperty('--animation-duration', '0.5s')
        document.documentElement.style.setProperty('--transition-duration', '0.2s')
    }

    const dashboard = new DiscordDashboard()
    window.addEventListener('beforeunload', () => { dashboard.destroy() })

    const gamesGrid = document.getElementById('gamesGrid')
    new InfiniteScroll(gamesGrid)

    setInterval(getCount, 16000)

    return dashboard
}

document.addEventListener('DOMContentLoaded', () => {
    countEl.textContent = formatInt(localStorage.getItem('last-count') || '0')

    initDashboard()
    afterDOM()
})

const afterDOM = async () => {
    await addVisit()
}


document.querySelectorAll('img, a').forEach(preventDrag)
new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'IMG' || node.tagName === 'A') preventDrag(node)
            if (node.querySelectorAll) node.querySelectorAll('img, a').forEach(preventDrag)
        })
    })
}).observe(document.body, { childList: true, subtree: true })

document.addEventListener('click', async e => {
    /** @type {HTMLElement} */
    const a = e.target.closest('a')
    if (!a || a.className !== 'game-icon') return

    const copy = a.getAttribute('data-copy')
    if (copy) {
        e.preventDefault()
        try {
            await navigator.clipboard.writeText(copy)
            showToast('Copied!')
        } catch {
            showModal(copy)
        }
    } else {
        const hrefTo = a.getAttribute('href-to')
        if (!hrefTo) return

        e.preventDefault()
        showConfirm(`You are going to: ${hrefTo}`, () => {
            try { window.open(hrefTo, '_blank') }
            catch { window.location.href = hrefTo }
        })
    }
})