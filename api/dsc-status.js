import { Client, GatewayIntentBits } from 'discord.js'

const TOKEN = process.env.DISCORD_BOT_TOKEN
const USER_ID = "658664592209215493"

let cache = new Map()
const CACHE_DURATION = 1 * 60 * 1000

function udecode(text) {
    return typeof text === 'string' ? Buffer.from(text, 'utf-8').toString() : text
}

const allowedOrigins = ["https://n1gh7shadez.vercel.app"]

export default async function handler(req, res) {
    const origin = req.headers.origin || ''

    if (!allowedOrigins.includes(origin)) return res.status(403).end()
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const cacheKey = `discord-user-${USER_ID}`
    const cachedData = cache.get(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {

        const etag = `"${Buffer.from(JSON.stringify(cachedData.data)).toString('base64')}"`
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`)
        res.setHeader('Expires', new Date(cachedData.timestamp + CACHE_DURATION).toUTCString())
        res.setHeader('ETag', etag)
        if (req.headers['if-none-match'] === etag) return res.status(304).end()
        return res.status(200).json({ ...cachedData.data, cached: true, cache_age: Math.floor((Date.now() - cachedData.timestamp) / 1000) })
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
                if (member && member.voice?.channel) {
                    const vc = member.voice.channel

                    const vcMembers = Array.from(vc.members.values()).map(m => ({
                        name: udecode(m.user.username),
                        display_name: udecode(m.displayName),
                        avatar: m.displayAvatarURL() || "null"
                    }))
                    vc_info = { guild: udecode(guild.name), guild_id: guild.id, channel: udecode(vc.name), channel_id: vc.id, members: vcMembers }
                    break
                }
            } catch { continue }
        }

        const activities_data = []
        if (member?.presence) {
            for (const activity of member.presence.activities) {
                let buttons = activity.buttons?.map(b => ({ label: b.label || "null", url: b.url || "null" })) || "null"
                activities_data.push({
                    name: udecode(activity.name),
                    type: activity.type.toString(),
                    details: activity.details || null,
                    state: activity.state || null,
                    large_image: activity.assets?.largeImageURL() || "null",
                    small_image: activity.assets?.smallImageURL() || "null",
                    buttons,
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
            avatar: member?.displayAvatarURL() || "null",
            status: member?.presence?.status || "null",
            vc_channel: vc_info || "null",
            activities: activities_data,
            cached: false,
            timestamp: new Date().toISOString()
        }

        cache.set(cacheKey, { data, timestamp: Date.now() })
        if (cache.size > 100) cache.delete(cache.keys().next().value)

        const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`)
        res.setHeader('Expires', new Date(Date.now() + CACHE_DURATION).toUTCString())
        res.setHeader('ETag', etag)
        if (req.headers['if-none-match'] === etag) return res.status(304).end()
        await client.destroy()
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        await client.destroy().catch(() => { })
        return res.status(500).json({ error: 'Failed to fetch Discord user data', message: error.message })
    }
}