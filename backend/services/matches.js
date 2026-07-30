import { prisma } from '../config/prisma.js';

const DEFAULT_FORMAT = 'Standard';

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parseVisibility(value) {
    if (value === 'PUBLIC' || value === 'PRIVATE') {
        return value;
    }
    return 'PRIVATE';
}

async function generateJoinCode() {
    for (let index = 0; index < 8; index += 1) {
        const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
        // eslint-disable-next-line no-await-in-loop
        const existing = await prisma.match.findUnique({ where: { joinCode } });
        if (!existing) {
            return joinCode;
        }
    }
    throw createError(500, 'Unable to generate lobby join code');
}

function normalizeMatch(match) {
    if (!match) return null;

    const players = [...(match.players || [])].sort((left, right) => left.seat - right.seat);
    const readyCount = players.filter((player) => player.ready).length;

    return {
        ...match,
        players,
        playerCount: players.length,
        readyCount,
    };
}

function matchInclude() {
    return {
        host: {
            select: { id: true, username: true, email: true },
        },
        players: {
            include: {
                user: {
                    select: { id: true, username: true, email: true },
                },
                deck: {
                    select: { id: true, name: true },
                },
            },
        },
    };
}

async function getMatchForParticipant(matchId, userId) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchInclude(),
    });

    if (!match) {
        throw createError(404, 'Match not found');
    }

    const isParticipant = match.players.some((player) => player.userId === userId);
    if (!isParticipant) {
        throw createError(403, 'Forbidden');
    }

    return match;
}

async function getMatchForLobbyAction(matchId) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchInclude(),
    });

    if (!match) {
        throw createError(404, 'Match not found');
    }

    if (match.status !== 'LOBBY') {
        throw createError(400, 'Lobby is no longer open');
    }

    return match;
}

function getNextSeat(players, maxPlayers) {
    const seats = new Set(players.map((player) => player.seat));
    for (let seat = 1; seat <= maxPlayers; seat += 1) {
        if (!seats.has(seat)) return seat;
    }
    return null;
}

export async function createMatch(hostId, payload = {}) {
    const maxPlayers = Number(payload.maxPlayers ?? 4);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
        throw createError(400, 'maxPlayers must be an integer between 2 and 4');
    }

    const joinCode = await generateJoinCode();

    const created = await prisma.match.create({
        data: {
            hostId,
            maxPlayers,
            format: typeof payload.format === 'string' && payload.format.trim() ? payload.format.trim() : DEFAULT_FORMAT,
            visibility: parseVisibility(payload.visibility),
            joinCode,
            players: {
                create: {
                    userId: hostId,
                    seat: 1,
                },
            },
        },
        include: matchInclude(),
    });

    return normalizeMatch(created);
}

export async function listMatchesForUser(userId) {
    const matches = await prisma.match.findMany({
        where: {
            players: {
                some: { userId },
            },
        },
        include: matchInclude(),
        orderBy: { updatedAt: 'desc' },
    });

    return matches.map(normalizeMatch);
}

export async function listActiveMatchesForUser(userId) {
    const matches = await prisma.match.findMany({
        where: {
            status: 'IN_PROGRESS',
            players: {
                some: { userId },
            },
        },
        include: matchInclude(),
        orderBy: { updatedAt: 'desc' },
    });

    return matches.map(normalizeMatch);
}

export async function getMatchById(matchId, userId) {
    const match = await getMatchForParticipant(matchId, userId);
    return normalizeMatch(match);
}

export async function joinMatch(matchIdOrJoinCode, userId) {
    const candidate = await prisma.match.findFirst({
        where: {
            OR: [{ id: matchIdOrJoinCode }, { joinCode: matchIdOrJoinCode.toUpperCase() }],
        },
        include: matchInclude(),
    });

    if (!candidate) {
        throw createError(404, 'Match not found');
    }
    if (candidate.status !== 'LOBBY') {
        throw createError(400, 'Lobby is no longer open');
    }

    const alreadyJoined = candidate.players.find((player) => player.userId === userId);
    if (alreadyJoined) {
        return normalizeMatch(candidate);
    }

    if (candidate.players.length >= candidate.maxPlayers) {
        throw createError(400, 'Lobby is full');
    }

    const seat = getNextSeat(candidate.players, candidate.maxPlayers);
    if (!seat) {
        throw createError(400, 'Lobby is full');
    }

    const joinedMatch = await prisma.match.update({
        where: { id: candidate.id },
        data: {
            players: {
                create: {
                    userId,
                    seat,
                },
            },
        },
        include: matchInclude(),
    });

    return normalizeMatch(joinedMatch);
}

export async function leaveMatch(matchId, userId) {
    const match = await getMatchForParticipant(matchId, userId);
    const departingPlayer = match.players.find((player) => player.userId === userId);
    const remainingPlayers = match.players.filter((player) => player.userId !== userId);

    if (!departingPlayer) {
        throw createError(403, 'Forbidden');
    }

    if (!remainingPlayers.length) {
        await prisma.match.delete({ where: { id: matchId } });
        return null;
    }

    const nextHostId = match.hostId === userId
        ? [...remainingPlayers].sort((left, right) => left.joinedAt.getTime() - right.joinedAt.getTime())[0].userId
        : match.hostId;

    const updated = await prisma.$transaction(async (tx) => {
        await tx.matchPlayer.delete({
            where: {
                matchId_userId: {
                    matchId,
                    userId,
                },
            },
        });

        return tx.match.update({
            where: { id: matchId },
            data: { hostId: nextHostId },
            include: matchInclude(),
        });
    });

    return normalizeMatch(updated);
}

export async function updateReadyState(matchId, userId, ready) {
    await getMatchForLobbyAction(matchId);

    const player = await prisma.matchPlayer.findUnique({
        where: {
            matchId_userId: {
                matchId,
                userId,
            },
        },
    });

    if (!player) {
        throw createError(403, 'Forbidden');
    }

    await prisma.matchPlayer.update({
        where: {
            matchId_userId: {
                matchId,
                userId,
            },
        },
        data: { ready: Boolean(ready) },
    });

    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: matchInclude(),
    });

    return normalizeMatch(match);
}

export async function startMatch(matchId, userId) {
    const match = await getMatchForLobbyAction(matchId);

    if (match.hostId !== userId) {
        throw createError(403, 'Only the lobby host can start the match');
    }

    if (match.players.length < 2 || match.players.length > 4) {
        throw createError(400, 'Match requires 2 to 4 players');
    }

    const everyoneReady = match.players.every((player) => player.ready);
    if (!everyoneReady) {
        throw createError(400, 'All players must be ready');
    }

    const started = await prisma.match.update({
        where: { id: matchId },
        data: { status: 'IN_PROGRESS' },
        include: matchInclude(),
    });

    return normalizeMatch(started);
}
