import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-secure-secret';
const SESSION_COOKIE_NAME = 'token';

export default function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}