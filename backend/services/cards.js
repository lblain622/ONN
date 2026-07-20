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

function getCharacterName(name) {
    return name.split(" - ")[0].trim();
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
    const normalizedQuery = typeof query === "string"
        ? query.trim()
        : "";

    const where = {};

    if (normalizedQuery) {
        where.name = {
            contains: normalizedQuery,
            mode: "insensitive",
        };
    }

    switch (cardType) {

        case "MAIN_DECK":
            where.type = {
                notIn: [
                    "LEGEND",
                    "TOKEN",
                    "RUNE",
                ],
            };
            break;

        case "CHAMPION": {
            const legends = await prisma.card.findMany({
                where: {
                    type: "LEGEND",
                },
                select: {
                    name: true,
                },
            });

            const championNames = legends.map((card) =>
                getCharacterName(card.name)
            );

            where.type = "UNIT";

            where.OR = championNames.map((name) => ({
                name: {
                    startsWith: `${name} -`,
                    mode: "insensitive",
                },
            }));

            break;
        }

        case "LEGEND":
            where.type = "LEGEND";
            break;

        case "BATTLEFIELD":
            where.type = "BATTLEFIELD";
            break;

        case "RUNE":
            where.type = "RUNE";
            break;

        default:
            if (cardType) {
                where.type = cardType;
            }
    }

    return prisma.card.findMany({
        where,
        orderBy: {
            name: "asc",
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
