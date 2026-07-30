import { prisma } from '../config/prisma.js';

const CARD_SEARCH_LIMIT = 40;

function normalizeCardType(cardType) {
    if (!cardType) return null;
    const normalized = String(cardType).trim().toUpperCase();
    if (!normalized || normalized === 'ALL') return null;
    if (normalized === 'ARTIFACT') return 'GEAR';
    return normalized;
}

export async function getCardById(cardId) {
    return prisma.card.findUnique({
        where: { id: cardId },
        include: {
            set: true,
            tags: {
                include: {
                    tag: true,
                },
            },
            domains: {
                include: {
                    domain: true,
                },
            },
        },
    });
}

export async function getCardsByType(cardType) {
    return prisma.card.findMany({
        where: { type: cardType },
        include: {
            set: true,
            tags: {
                include: {
                    tag: true,
                },
            },
            domains: {
                include: {
                    domain: true,
                },
            },
        },
    });
}

export async function searchCardsByName(name) {
    return prisma.card.findMany({
        where: {
            name: {
                contains: name,
                mode: 'insensitive',
            },
        },
        include: {
            set: true,
            tags: {
                include: {
                    tag: true,
                },
            },
            domains: {
                include: {
                    domain: true,
                },
            },
        },
    });
}

export async function searchCardsByAnyField(query) {
    return prisma.card.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { type: { contains: query, mode: 'insensitive' } },
            ],
        },
        include: {
            set: true,
            tags: {
                include: {
                    tag: true,
                },
            },
            domains: {
                include: {
                    domain: true,
                },
            },
        },
    });
}

export async function searchCards(query, cardType = null) {
    const normalizedQuery = typeof query === 'string' ? query.trim() : '';
    const normalizedType = normalizeCardType(cardType);
    const where = {
        ...(normalizedType ? { type: normalizedType } : {}),
        ...(normalizedQuery
            ? {
                OR: [
                    { name: { contains: normalizedQuery, mode: 'insensitive' } },
                    { cleanName: { contains: normalizedQuery, mode: 'insensitive' } },
                    { plainText: { contains: normalizedQuery, mode: 'insensitive' } },
                    { domains: { some: { domain: { name: { contains: normalizedQuery, mode: 'insensitive' } } } } },
                    { tags: { some: { tag: { name: { contains: normalizedQuery, mode: 'insensitive' } } } } },
                ],
            }
            : {}),
    };

    return prisma.card.findMany({
        where,
        take: CARD_SEARCH_LIMIT,
        orderBy: {
            name: 'asc',
        },
        include: {
            set: true,
            tags: {
                include: {
                    tag: true,
                },
            },
            domains: {
                include: {
                    domain: true,
                },
            },
        },
    });
}