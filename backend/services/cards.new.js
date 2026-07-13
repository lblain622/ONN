import { prisma } from '../config/prisma.js';

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
    return prisma.card.findMany({
        where: {
            name: {
                contains: query,
                mode: 'insensitive',
            },
            ...(cardType ? { type: cardType } : {}),
        },
        take: 8,
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