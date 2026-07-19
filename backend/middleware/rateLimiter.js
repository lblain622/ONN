import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for auth endpoints (login / register).
 * 5 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again after 15 minutes.',
    },
    skipSuccessfulRequests: false,
});

/**
 * General limiter for all other API routes.
 * 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please slow down.',
    },
    skipSuccessfulRequests: true,
});
