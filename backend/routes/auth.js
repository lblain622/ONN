import express from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-secure-secret';
const SESSION_COOKIE_NAME = 'token';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
    });
}

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await authService.authenticateUser(email, password);
    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    setSessionCookie(res, token);

    res.status(200).json({
        email: user.email,
        role: user.role,
    });
}));

router.post('/register', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const newUser = await authService.registerUser(email, password);
    const token = jwt.sign(
        {
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    setSessionCookie(res, token);

    res.status(201).json({
        email: newUser.email,
        role: newUser.role,
    });
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
