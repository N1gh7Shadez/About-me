import admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
})

const db = admin.firestore()

let cache = { count: 0, lastVisit: null, timestamp: 0 }
const CACHE_DURATION = 60 * 1000
const COOLDOWN = 15 * 1000
let ipCooldown = new Map()
const allowedOrigins = ["https://n1gh7shadez.vercel.app"]

export default async function handler(req, res) {
    const origin = req.headers.origin || ''

    if (!allowedOrigins.includes(origin)) return res.status(403).end()
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()

    const now = Date.now()
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress

    if (req.method === 'GET') {
        if (now - cache.timestamp < CACHE_DURATION) return res.status(200).json(cache)

        const doc = await db.collection('counters').doc('visitors').get()
        cache = { ...(doc.exists ? doc.data() : { count: 0, lastVisit: null }), timestamp: now }
        return res.status(200).json(cache)
    }

    if (req.method === 'POST') {

        if (ipCooldown.has(ip) && now - ipCooldown.get(ip) < COOLDOWN) return res.status(200).json(cache)
        ipCooldown.set(ip, now)

        const docRef = db.collection('counters').doc('visitors')

        await docRef.update({ count: admin.firestore.FieldValue.increment(1), lastVisit: admin.firestore.FieldValue.serverTimestamp() })
        const doc = await docRef.get()

        cache = { ...doc.data(), timestamp: now }
        return res.status(200).json(cache)
    }

    res.status(405).json({ error: 'Method not allowed' })
}