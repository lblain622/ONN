import { rateLimit } from 'express-rate-limit';

export default rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many requests. Please try again shortly.',
    },
});
