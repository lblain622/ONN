const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

const bucket = new Map();

function getClientKey(req) {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

export default function rateLimit(req, res, next) {
    const key = getClientKey(req);
    const now = Date.now();
    const record = bucket.get(key);

    if (!record || now - record.startedAt >= WINDOW_MS) {
        bucket.set(key, { startedAt: now, count: 1 });
        return next();
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ message: 'Too many requests. Please try again shortly.' });
    }

    record.count += 1;
    bucket.set(key, record);
    return next();
}
