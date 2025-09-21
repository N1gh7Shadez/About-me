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

export default async function handler(req, res) {
    const now = Date.now()

    if (req.method === 'GET') {
        if (now - cache.timestamp < CACHE_DURATION) return res.status(200).json(cache)

        const doc = await db.collection('counters').doc('visitors').get()
        const data = doc.exists ? doc.data() : { count: 0, lastVisit: null }
        cache = { ...data, timestamp: now }
        return res.status(200).json(cache)
    }

    if (req.method === 'POST') {
        const docRef = db.collection('counters').doc('visitors')
        await docRef.update({
            count: admin.firestore.FieldValue.increment(1),
            lastVisit: admin.firestore.FieldValue.serverTimestamp()
        })

        const doc = await docRef.get()
        const data = doc.data()
        cache = { ...data, timestamp: now }

        return res.status(200).json(cache)
    }

    res.status(405).json({ error: 'Method not allowed' })
}