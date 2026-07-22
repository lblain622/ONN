import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth from '../middleware/auth.js';
import { searchCards } from '../services/cards.js';

const router = express.Router();

const VALID_CARD_TYPES = new Set(['UNIT', 'SPELL', 'LEGEND', 'GEAR', 'BATTLEFIELD', 'RUNE','MAIN_DECK','TOKEN','CHAMPION']);

router.get('/search', auth, asyncHandler(async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const rawType = typeof req.query.type === 'string' ? req.query.type.trim().toUpperCase() : '';

    if (query.length === 1) return res.json([]);

    if (rawType && !VALID_CARD_TYPES.has(rawType)) {
        return res.status(400).json({ message: `Invalid card type. Must be one of: ${[...VALID_CARD_TYPES].join(', ')}` });
    }

    const cards = await searchCards(query, rawType || null);
    console.log(cards);
    res.json(cards);
}));

export default router;
