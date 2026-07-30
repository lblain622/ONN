import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth from '../middleware/auth.js';
import { searchCards } from '../services/cards.new.js';

const router = express.Router();

router.get('/search', auth, asyncHandler(async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const cardType = typeof req.query.type === 'string' ? req.query.type.trim().toUpperCase() : '';

    const cards = await searchCards(query, cardType || null);
    res.json(cards);
}));

export default router;
