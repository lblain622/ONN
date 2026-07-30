import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import auth, { authorize } from '../middleware/auth.js';
import {
    createMatch,
    getMatchById,
    joinMatch,
    leaveMatch,
    listActiveMatchesForUser,
    listMatchesForUser,
    startMatch,
    updateReadyState,
} from '../services/matches.js';

const router = express.Router();

router.post('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await createMatch(req.user.userId, req.body || {});
    res.status(201).json(match);
}));

router.get('/', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const matches = await listMatchesForUser(req.user.userId);
    res.json(matches);
}));

router.get('/active', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const matches = await listActiveMatchesForUser(req.user.userId);
    res.json(matches);
}));

router.get('/:matchId', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await getMatchById(req.params.matchId, req.user.userId);
    res.json(match);
}));

router.post('/:matchId/join', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const requestedCode = typeof req.body?.joinCode === 'string' ? req.body.joinCode.trim() : '';
    const target = requestedCode || req.params.matchId;
    const match = await joinMatch(target, req.user.userId);
    res.json(match);
}));

router.post('/:matchId/leave', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await leaveMatch(req.params.matchId, req.user.userId);
    if (!match) {
        return res.json({ message: 'Lobby closed' });
    }
    res.json(match);
}));

router.post('/:matchId/ready', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await updateReadyState(req.params.matchId, req.user.userId, true);
    res.json(match);
}));

router.post('/:matchId/unready', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await updateReadyState(req.params.matchId, req.user.userId, false);
    res.json(match);
}));

router.post('/:matchId/start', auth, authorize('USER', 'ADMIN'), asyncHandler(async (req, res) => {
    const match = await startMatch(req.params.matchId, req.user.userId);
    res.json(match);
}));

export default router;
