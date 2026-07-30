import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth, { authorize } from '../middleware/auth.js';
import rateLimit from '../middleware/rateLimit.js';
import {
    copyDeck,
    createDeck,
    deleteDeck,
    getDeckById,
    getCommunityDecks,
    getDecksByUserId,
    updateDeck,
    updateDeckVisibility,
} from '../services/decks.js';

const router = express.Router();
router.use(rateLimit);

router.get('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const decks = await getDecksByUserId(req.user.userId);
    res.json(decks);
}));

router.get('/my', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const decks = await getDecksByUserId(req.user.userId);
    res.json(decks);
}));

router.get('/community', auth, authorize('USER', 'ADMIN'), asyncHandler(async (_req, res) => {
    const decks = await getCommunityDecks();
    res.json(decks);
}));

router.get('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const deck = await getDeckById(deckId);

    if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (!deck.isPublic && deck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(deck);
}));

router.post('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { name, description, builderDetails, cards = [], isPublic = false } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Deck name is required' });
    }

    const trimmedDescription = description?.trim() || null;
    const builderText = builderDetails ? `Deck builder rules: 1 legend card; 40-card main deck including ${builderDetails.championCard || 'the chosen champion'}; exactly 12 rune cards; exactly 3 battlefields; every card must match the legend's domain and colors (${builderDetails.domain || 'domain'} / ${builderDetails.colors || 'colors'}).` : null;
    const persistedDescription = [trimmedDescription, builderText].filter(Boolean).join('\n\n') || null;

    const deck = await createDeck(req.user.userId, name.trim(), persistedDescription, cards, isPublic);
    res.status(201).json(deck);
}));

router.put('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name, description, cards = [], isPublic = false } = req.body;
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

    const updatedDeck = await updateDeck(deckId, name.trim(), description?.trim() || null, cards, isPublic);
    res.json(updatedDeck);
}));

async function handleUpdateShare(req, res) {
    const { deckId } = req.params;
    const { isPublic } = req.body;
    const existingDeck = await getDeckById(deckId);

    if (!existingDeck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (existingDeck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: 'isPublic must be a boolean' });
    }

    const updatedDeck = await updateDeckVisibility(deckId, isPublic);
    res.json(updatedDeck);
}

router.patch('/:deckId/share', auth, authorize('USER', 'ADMIN'), asyncHandler(handleUpdateShare));
router.patch('/:deckId/visibility', auth, authorize('USER', 'ADMIN'), asyncHandler(handleUpdateShare));

router.post('/:deckId/copy', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name } = req.body;
    const sourceDeck = await getDeckById(deckId);

    if (!sourceDeck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    const canCopy = sourceDeck.isPublic || sourceDeck.ownerId === req.user.userId || req.user.role === 'ADMIN';
    if (!canCopy) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const copiedDeck = await copyDeck(sourceDeck, req.user.userId, (name?.trim() || `${sourceDeck.name} (Copy)`));
    res.status(201).json(copiedDeck);
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