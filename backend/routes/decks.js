import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth, { authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    res.json({
        message: 'Deck list for user',
        user: req.user,
    });
}));

router.get('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    res.json({
        message: `Deck details for deck ${deckId}`,
        user: req.user,
    });
}));

router.post('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    res.status(201).json({
        message: 'Deck created',
        ownerId: req.user.userId,
        name,
        description,
    });
}));

router.put('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { name, description } = req.body;
    res.json({
        message: `Deck ${deckId} updated`,
        updatedBy: req.user.userId,
        name,
        description,
    });
}));

router.delete('/:deckId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    res.json({
        message: `Deck ${deckId} deleted`,
        deletedBy: req.user.userId,
    });
}));

export default router;