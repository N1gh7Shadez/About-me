class DiscordDashboard {
    constructor() {
        this.games = [
            { name: 'Discord', url: 'https://discord.com/users/658664592209215493', img: "../../assets/images/Discord.png" },
            { name: 'Facebook', url: 'https://www.facebook.com/N1gh7Shadez', img: "../../assets/images/Facebook.png" },
            { name: 'Instagram', url: 'https://www.instagram.com/n1gh7shadez?igsh=MTFnNzZjbWc2dm5zMA==', img: "../../assets/images/Instagram.png" },
            // { name: 'Tiktok', url: 'https://www.tiktok.com/@n1gh7shadez', img: "../../assets/images/Tiktok.png" },
            { name: 'Youtube', url: 'https://www.youtube.com/@n1ghtshadez?sub_confirmation=1', img: "../../assets/images/Youtube.png" },
            { name: 'Twitch', url: 'https://www.twitch.tv/n1gh7shadez', img: "../../assets/images/Twitch.png" },
            { name: 'Spotify', url: 'https://open.spotify.com/user/ibpz1xtf2pj9a7anrvnft1ygl', img: "../../assets/images/Spotify.png" },
            { name: 'Riot', url: 'N1gh7Shadez#17250', img: "../../assets/images/Riot.png" },
            { name: 'Roblox', url: 'https://www.roblox.com/users/1207490727/profile', img: "../../assets/images/Roblox.png" },
            // { name: 'RoV', url: 'N1gh7Shadez', img: "../../assets/images/RoV.png" },
            // { name: 'CookieRun: Kingdom', url: 'N1ghtshadez', img: "../../assets/images/games/CookierunKingdom.png" },
        ]

        this.gamesIcon = {
            // <aitji> this will get file from "assets/images/games/..."
            // kept it lowercase for game name
            'minecraft': 'Minecraft.png',
            'valorant': 'Valorant.png',
            'roblox': '../Roblox.png',
            'hollow knight: silksong': 'HollowKnight.png',
            'google play games': 'Google Play Game.png',
            'cookierun: kingdom': 'CookierunKingdom.png',
            'walk of life': 'wol.png',
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
        this.renderGames()
        this.createWaveform()
        this.setupAudioControls()
        this.setupVCModal()
        this.startDiscordRPCFetching()
        this.renderSkeletonRPC()
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
}

