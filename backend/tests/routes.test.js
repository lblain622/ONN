import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Must be mocked before app is imported
vi.mock('../config/prisma.js', () => ({
    prisma: {
        user: { findUnique: vi.fn(), create: vi.fn() },
        deck: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findFirst: vi.fn() },
        deckCard: { createMany: vi.fn(), deleteMany: vi.fn() },
        card: { findMany: vi.fn() },
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(async (pw) => `hashed:${pw}`),
        compare: vi.fn(async (pw, hash) => hash === `hashed:${pw}`),
    },
}));

// Mock jwt so token verification always succeeds for tokens signed with 'test-secret'
vi.mock('jsonwebtoken', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual.default,
            verify: vi.fn((token) => {
                // Decode without verification for test tokens
                const payload = actual.default.decode(token);
                if (!payload) throw new Error('invalid token');
                return payload;
            }),
        },
    };
});

process.env.JWT_SECRET = 'test-secret-for-tests';

import app from '../app.js';
import { prisma } from '../config/prisma.js';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-for-vitest';

const mockUser = {
    id: 'user_1',
    email: 'test@example.com',
    username: 'test@example.com',
    passwordHash: 'hashed:password123',
    role: 'USER',
};

function makeToken(payload = { userId: 'user_1', email: 'test@example.com', role: 'USER' }) {
    return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
}

beforeEach(() => vi.clearAllMocks());

// ── Auth routes ───────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
    it('returns 201 and sets a cookie on valid input', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue(mockUser);

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ email: 'test@example.com' });
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 400 for weak password', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test@example.com', password: 'short' });

        expect(res.status).toBe(400);
        expect(res.body.errors[0].field).toBe('password');
    });

    it('returns 400 for invalid email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'not-an-email', password: 'password123' });

        expect(res.status).toBe(400);
    });
});

describe('POST /auth/login', () => {
    it('returns 200 with user on valid credentials', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('test@example.com');
    });

    it('returns 400 for missing password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(400);
    });
});

describe('GET /auth/me', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns user info with a valid token', async () => {
        const token = makeToken();
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('test@example.com');
    });
});

// ── Deck routes ───────────────────────────────────────────────────────────────

describe('GET /decks', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get('/decks');
        expect(res.status).toBe(401);
    });

    it('returns decks for authenticated user', async () => {
        prisma.deck.findMany.mockResolvedValue([{ id: 'deck_1', name: 'Test' }]);
        const res = await request(app)
            .get('/decks')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe('POST /decks', () => {
    it('creates a deck with a valid payload', async () => {
        prisma.deck.create.mockResolvedValue({ id: 'deck_1', name: 'My Deck' });
        const res = await request(app)
            .post('/decks')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ name: 'My Deck' });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('My Deck');
    });

    it('returns 400 for missing deck name', async () => {
        const res = await request(app)
            .post('/decks')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('GET /health', () => {
    it('returns 200 ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('GET /cards/search', () => {
    it('returns 401 without auth', async () => {
        const res = await request(app).get('/cards/search?query=test');
        expect(res.status).toBe(401);
    });

    it('returns empty array for short queries', async () => {
        const res = await request(app)
            .get('/cards/search?query=a')
            .set('Authorization', `Bearer ${makeToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('returns all cards when query is empty', async () => {
        prisma.card.findMany.mockResolvedValue([{ id: 'card_1', name: 'Fire Bolt', type: 'SPELL' }]);
        const res = await request(app)
            .get('/cards/search')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 'card_1', name: 'Fire Bolt', type: 'SPELL' }]);
    });

    it('returns 400 for invalid card type', async () => {
        const res = await request(app)
            .get('/cards/search?query=fire&type=INVALID')
            .set('Authorization', `Bearer ${makeToken()}`);
        expect(res.status).toBe(400);
    });
});
