import express from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import auth from '../middleware/auth.js';
import { validate, loginSchema, registerSchema } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_COOKIE_NAME = 'token';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
    });
}

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.authenticateUser(email, password);
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, displayName: user.displayName },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
    setSessionCookie(res, token);
    res.status(200).json({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
}));

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body;
    const newUser = await authService.registerUser(email, password, displayName);
    const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role, displayName: newUser.displayName },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
    setSessionCookie(res, token);
    res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role, displayName: newUser.displayName });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
    res.json({ id: req.user.userId, email: req.user.email, role: req.user.role, displayName: req.user.displayName });
}));

router.post('/logout', asyncHandler(async (req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
}));

export default router;
