import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth, { authorize } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import {
    copyDeck,
    createDeck,
    deleteDeck,
    getDeckById,
    getDecksByUserId,
    getPublicDecks,
    updateDeck,
} from '../services/decks.js';

const router = express.Router();

router.get('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const decks = await getDecksByUserId(req.user.userId);
    res.json(decks);
}));

router.get('/community', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const decks = await getPublicDecks();
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
    const { name, description, builderDetails, isPublic, cards } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Deck name is required' });
    }

    const trimmedDescription = description?.trim() || null;
    const builderText = builderDetails ? `Deck builder rules: 1 legend card; 40-card main deck including ${builderDetails.championCard || 'the chosen champion'}; exactly 12 rune cards; exactly 3 battlefields; every card must match the legend's domain and colors (${builderDetails.domain || 'domain'} / ${builderDetails.colors || 'colors'}).` : null;
    const persistedDescription = [trimmedDescription, builderText].filter(Boolean).join('\n\n') || null;

    const deck = await createDeck(req.user.userId, name.trim(), persistedDescription, Boolean(isPublic));

    // Add cards if provided
    if (cards && Array.isArray(cards) && cards.length > 0) {
        await prisma.deckCard.createMany({
            data: cards.map(c => ({
                deckId: deck.id,
                cardId: c.cardId,
                quantity: c.quantity
            }))
        });
    }

    res.status(201).json(deck);
}));

router.post('/:deckId/copy', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name } = req.body;

    const copiedDeck = await copyDeck(req.user.userId, deckId, name);
    res.status(201).json(copiedDeck);
}));

router.put('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name, description, isPublic, cards } = req.body;
    const existingDeck = await getDeckById(deckId);

    if (!existingDeck) {
        return res.status(404).json({ message: 'Deck not found' });
    }

    if (existingDeck.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
        return res.status(400).json({ message: 'Deck name is required' });
    }

    // Update basic info
    const updatedDeck = await updateDeck(
        deckId,
        name !== undefined ? name.trim() : existingDeck.name,
        description !== undefined ? description?.trim() : existingDeck.description,
        isPublic !== undefined ? Boolean(isPublic) : existingDeck.isPublic
    );

    // Update cards if provided
    if (cards && Array.isArray(cards)) {
        await prisma.deckCard.deleteMany({ where: { deckId } });
        if (cards.length > 0) {
            await prisma.deckCard.createMany({
                data: cards.map(c => ({
                    deckId,
                    cardId: c.cardId,
                    quantity: c.quantity
                }))
            });
        }
    }

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
