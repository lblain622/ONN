import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth, { authorize } from '../middleware/auth.js';
import {
    createDeck,
    deleteDeck,
    getDeckById,
    getDecksByUserId,
    updateDeck,
} from '../services/decks.js';

const router = express.Router();

router.get('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const decks = await getDecksByUserId(req.user.userId);
    res.json(decks);
}));

router.get('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const deck = await getDeckById(deckId);

    if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (deck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(deck);
}));

router.post('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { name, description, builderDetails } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Deck name is required' });
    }

    const trimmedDescription = description?.trim() || null;
    const builderText = builderDetails ? `Deck builder rules: 1 legend card; 40-card main deck including ${builderDetails.championCard || 'the chosen champion'}; exactly 12 rune cards; exactly 3 battlefields; every card must match the legend's domain and colors (${builderDetails.domain || 'domain'} / ${builderDetails.colors || 'colors'}).` : null;
    const persistedDescription = [trimmedDescription, builderText].filter(Boolean).join('\n\n') || null;

    const deck = await createDeck(req.user.userId, name.trim(), persistedDescription);
    res.status(201).json(deck);
}));

router.put('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name, description } = req.body;
    const existingDeck = await getDeckById(deckId);

    if (!existingDeck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (existingDeck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Deck name is required' });
    }

    const updatedDeck = await updateDeck(deckId, name.trim(), description?.trim() || null);
    res.json(updatedDeck);
}));

router.delete('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const existingDeck = await getDeckById(deckId);

    if (!existingDeck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (existingDeck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await deleteDeck(deckId);
    res.json({ message: 'Deck deleted successfully' });
}));

export default router;