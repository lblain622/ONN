import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        deck: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        deckCard: {
            createMany: vi.fn(),
        },
        $transaction: vi.fn(async (fn) => fn({
            deck: { create: vi.fn(async (args) => ({ id: 'copy_1', ...args.data })) },
            deckCard: { createMany: vi.fn() },
        })),
    },
}));

import { prisma } from '../config/prisma.js';
import {
    createDeck,
    getDeckById,
    getDecksByUserId,
    getPublicDecks,
    updateDeck,
    deleteDeck,
    copyDeck,
} from '../services/decks.js';

const mockDeck = {
    id: 'deck_1',
    name: 'Test Deck',
    description: null,
    isPublic: false,
    ownerId: 'user_1',
    format: 'Standard',
    cards: [],
};

beforeEach(() => vi.clearAllMocks());

describe('createDeck', () => {
    it('creates and returns a deck', async () => {
        prisma.deck.create.mockResolvedValue(mockDeck);
        const result = await createDeck('user_1', 'Test Deck', null, false);
        expect(prisma.deck.create).toHaveBeenCalledWith({
            data: { ownerId: 'user_1', name: 'Test Deck', description: null, isPublic: false },
        });
        expect(result).toEqual(mockDeck);
    });
});

describe('getDeckById', () => {
    it('returns deck when found', async () => {
        prisma.deck.findUnique.mockResolvedValue(mockDeck);
        const result = await getDeckById('deck_1');
        expect(result).toEqual(mockDeck);
    });

    it('returns null when not found', async () => {
        prisma.deck.findUnique.mockResolvedValue(null);
        const result = await getDeckById('missing');
        expect(result).toBeNull();
    });
});

describe('getDecksByUserId', () => {
    it('returns an array of decks for the user', async () => {
        prisma.deck.findMany.mockResolvedValue([mockDeck]);
        const result = await getDecksByUserId('user_1');
        expect(result).toHaveLength(1);
        expect(prisma.deck.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { ownerId: 'user_1' },
        }));
    });
});

describe('getPublicDecks', () => {
    it('only fetches public decks', async () => {
        prisma.deck.findMany.mockResolvedValue([]);
        await getPublicDecks();
        expect(prisma.deck.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { isPublic: true },
        }));
    });
});

describe('updateDeck', () => {
    it('updates and returns the deck', async () => {
        const updated = { ...mockDeck, name: 'Renamed' };
        prisma.deck.update.mockResolvedValue(updated);
        const result = await updateDeck('deck_1', 'Renamed', null, false);
        expect(result.name).toBe('Renamed');
    });
});

describe('deleteDeck', () => {
    it('calls prisma.deck.delete with the correct id', async () => {
        prisma.deck.delete.mockResolvedValue(mockDeck);
        await deleteDeck('deck_1');
        expect(prisma.deck.delete).toHaveBeenCalledWith({ where: { id: 'deck_1' } });
    });
});

describe('copyDeck', () => {
    it('throws when the source deck does not exist', async () => {
        prisma.deck.findUnique.mockResolvedValue(null);
        await expect(copyDeck('user_1', 'missing', null)).rejects.toThrow('Deck not found');
    });

    it('creates a copy with a unique name', async () => {
        prisma.deck.findUnique.mockResolvedValue({ ...mockDeck, cards: [] });
        prisma.deck.findFirst.mockResolvedValue(null); // name is available
        const result = await copyDeck('user_2', 'deck_1', 'My Copy');
        expect(result).toMatchObject({ ownerId: 'user_2', isPublic: false });
    });
});
