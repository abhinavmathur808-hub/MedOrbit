import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many AI requests, please try again later.' },
});

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
