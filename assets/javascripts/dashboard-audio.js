class AudioDashboard extends DiscordDashboard {
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
        const volumeButton = document.getElementById('volumeButton')
        const volumeIcon = document.getElementById('volumeIcon')
        const volumeSlider = document.getElementById('volumeSlider')
        const volumeValue = document.getElementById('volumeValue')

        if (!audio || !playButton) return

        let isPlaying = false
        let lastAudibleVolume = 0.05
        audio.volume = 0.05
        playButton.innerHTML = '<i class="fas fa-play"></i>'

        const updateVolumeDisplay = () => {
            const visibleVolume = audio.muted ? 0 : Math.round(audio.volume * 100)

            if (volumeSlider) volumeSlider.value = visibleVolume
            if (volumeValue) volumeValue.textContent = `${visibleVolume}%`
            if (volumeButton) {
                volumeButton.setAttribute('aria-label', visibleVolume === 0 ? 'Unmute music' : 'Mute music')
            }

            if (!volumeIcon) return

            if (visibleVolume === 0) volumeIcon.className = 'fas fa-volume-xmark'
            else if (visibleVolume < 50) volumeIcon.className = 'fas fa-volume-low'
            else volumeIcon.className = 'fas fa-volume-high'
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                const nextVolume = Number(volumeSlider.value) / 100
                audio.muted = false
                audio.volume = nextVolume
                if (nextVolume > 0) lastAudibleVolume = nextVolume
                updateVolumeDisplay()
            })
        }

        if (volumeButton) {
            volumeButton.addEventListener('click', () => {
                if (audio.muted || audio.volume === 0) {
                    audio.muted = false
                    audio.volume = lastAudibleVolume
                } else {
                    lastAudibleVolume = audio.volume
                    audio.muted = true
                }

                updateVolumeDisplay()
            })
        }

        audio.addEventListener('volumechange', updateVolumeDisplay)
        updateVolumeDisplay()

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
}
