import { Client, GatewayIntentBits } from 'discord.js'

const TOKEN = process.env.DISCORD_BOT_TOKEN
const USER_ID = "658664592209215493"

let cache = new Map()
const CACHE_DURATION = 1 * 60 * 1000

function udecode(text) {
    return typeof text === 'string' ? Buffer.from(text, 'utf-8').toString() : text
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const cacheKey = `discord-user-${USER_ID}`
    const cachedData = cache.get(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('Returning cached data')

        const etag = `"${Buffer.from(JSON.stringify(cachedData.data)).toString('base64')}"`
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`)
        res.setHeader('Expires', new Date(cachedData.timestamp + CACHE_DURATION).toUTCString())
        res.setHeader('ETag', etag)

        if (req.headers['if-none-match'] === etag) return res.status(304).end()
        return res.status(200).json({
            ...cachedData.data,
            cached: true,
            cache_age: Math.floor((Date.now() - cachedData.timestamp) / 1000)
        })
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates
        ]
    })

    try {
        await client.login(TOKEN)
        await new Promise(resolve => client.once('ready', resolve))

        let member = null
        let vc_info = null

        for (const guild of client.guilds.cache.values()) {
            try {
                member = await guild.members.fetch(USER_ID).catch(() => null)

                if (member && member.voice && member.voice.channel) {
                    const vc = member.voice.channel
                    const vcMembers = []

                    for (const vcMember of vc.members.values()) {
                        vcMembers.push({
                            name: udecode(vcMember.user.username),
                            display_name: udecode(vcMember.displayName),
                            avatar: vcMember.displayAvatarURL() || "null"
                        })
                    }

                    vc_info = {
                        guild: udecode(guild.name),
                        guild_id: guild.id,
                        channel: udecode(vc.name),
                        channel_id: vc.id,
                        members: vcMembers
                    }
                    break
                }
            } catch (error) {
                console.error(`Error fetching member from guild ${guild.name}:`, error)
                continue
            }
        }

        const activities_data = []
        if (member && member.presence) {
            for (const activity of member.presence.activities) {
                let img_large = null
                let img_small = null

                if (activity.assets) {
                    img_large = activity.assets.largeImageURL()
                    img_small = activity.assets.smallImageURL()
                }

                let buttons = null
                if (activity.buttons && activity.buttons.length > 0) {
                    buttons = activity.buttons.map(button => ({
                        label: button.label || "null",
                        url: button.url || "null"
                    }))
                }

                activities_data.push({
                    name: udecode(activity.name),
                    type: activity.type.toString(),
                    details: activity.details || null,
                    state: activity.state || null,
                    large_image: img_large || "null",
                    small_image: img_small || "null",
                    buttons: buttons || "null",
                    timestamps: {
                        start: activity.timestamps?.start ? new Date(activity.timestamps.start).toISOString() : "null",
                        end: activity.timestamps?.end ? new Date(activity.timestamps.end).toISOString() : "null"
                    }
                })
            }
        }

        const data = {
            user_id: USER_ID,
            name: member ? udecode(member.user.globalName) : "n1gh7shadez", 
            avatar: member && member.displayAvatarURL() ? member.displayAvatarURL() : "null",
            status: member && member.presence ? member.presence.status : "null",
            vc_channel: vc_info || "null",
            activities: activities_data,
            cached: false,
            timestamp: new Date().toISOString()
        }

        cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        })

        if (cache.size > 100) {
            const oldestKey = cache.keys().next().value
            cache.delete(oldestKey)
        }

        await client.destroy()

        const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`)
        res.setHeader('Expires', new Date(Date.now() + CACHE_DURATION).toUTCString())
        res.setHeader('ETag', etag)

        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end()
        }

        return res.status(200).json(data)

    } catch (error) {
        console.error('Error:', error)
        try { await client.destroy() }
        catch (destroyError) { console.error('Error destroying client:', destroyError) }

        return res.status(500).json({
            error: 'Failed to fetch Discord user data',
            message: error.message
        })
    }
}