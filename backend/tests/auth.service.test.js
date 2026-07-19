import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(async (pw) => `hashed:${pw}`),
        compare: vi.fn(async (pw, hash) => hash === `hashed:${pw}`),
    },
}));

import { prisma } from '../config/prisma.js';
import { registerUser, authenticateUser, checkUserExists } from '../services/auth.js';

const mockUser = {
    id: 'user_1',
    email: 'test@example.com',
    username: 'test@example.com',
    passwordHash: 'hashed:password123',
    role: 'USER',
};

beforeEach(() => vi.clearAllMocks());

describe('registerUser', () => {
    it('creates a new user and returns them', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue(mockUser);

        const result = await registerUser('test@example.com', 'password123');

        expect(prisma.user.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ email: 'test@example.com' }),
        });
        expect(result).toEqual(mockUser);
    });

    it('throws if user already exists', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        await expect(registerUser('test@example.com', 'password123')).rejects.toThrow('User already exists');
    });

    it('throws if email or password is missing', async () => {
        await expect(registerUser('', 'pass')).rejects.toThrow('Email and password are required');
        await expect(registerUser('email@test.com', '')).rejects.toThrow('Email and password are required');
    });
});

describe('authenticateUser', () => {
    it('returns the user on valid credentials', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        const result = await authenticateUser('test@example.com', 'password123');
        expect(result).toEqual(mockUser);
    });

    it('throws on wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        await expect(authenticateUser('test@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });

    it('throws when user does not exist', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(authenticateUser('nobody@example.com', 'pass')).rejects.toThrow('Invalid credentials');
    });
});

describe('checkUserExists', () => {
    it('returns true when user found', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        expect(await checkUserExists('test@example.com')).toBe(true);
    });

    it('returns false when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        expect(await checkUserExists('nobody@example.com')).toBe(false);
    });
});
