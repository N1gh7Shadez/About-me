const OG_DOMAIN = [
    // <aitji> i do not sure if it need "/" or not but kept it :)
    "https://n1gh7shadez.vercel.app", "https://n1gh7shadez.vercel.app/"
]

// <aitji> for testing only
// const ALLOWED_ORIGINS = [...OG_DOMAIN, 'http://127.0.0.1:5500', 'http://localhost:5500', 'https://localhost']

const ALLOWED_METHODS = [
    'POST', 'GET', 'DELETE',
    'OPTIONS', 'PATCH'
]
const ALLOWED_HEADERS = [
    'Content-Type', 'Authorization',
    'UserAuth', 'Access-Control-Allow-Headers',
    'Origin', 'X-Requested-With',
    'X-CSRF-Token', 'Accept',
    'Accept-Version', 'Content-Length',
    'Content-MD5', 'Date',
    'X-Api-Version'
]

export const gateway = (req, res) => {
    const origin = req.headers.origin || req.headers.referer

    if (typeof origin === 'string' && OG_DOMAIN.includes(origin)) { // <aitji> if testing change this to ALLOWED_ORIGINS
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '))
        res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '))
        res.setHeader('Access-Control-Allow-Credentials', 'true')

        if (req.method === 'OPTIONS') {
            res.status(200).end()
            return true
        }

        return true
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'null')
        return res.status(403).json({ error: 'forbidden...' })
    }
}