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
    async function getChampionPrefixes() {
        const legends = await prisma.card.findMany({
            where: {
                type: "LEGEND",
            },
            select: {
                name: true,
            },
        });

        return new Set(
            legends.map(card => card.name.split(" - ")[0].trim())
        );
    }

    switch (cardType) {

        case "MAIN_DECK": {
            const legends = await prisma.card.findMany({
                where: { type: "LEGEND" },
                select: { name: true },
            });

            const legendPrefixes = new Set(
                legends.map(card => card.name.split(" - ")[0].trim())
            );

            const cards = await prisma.card.findMany({
                where: {
                    ...(normalizedQuery && {
                        name: {
                            contains: normalizedQuery,
                            mode: "insensitive",
                        },
                    }),
                    type: {
                        notIn: [
                            "LEGEND",
                            "RUNE",
                            "BATTLEFIELD",
                        ],
                    },
                },
                include: {
                    set: true,
                    tags: { include: { tag: true } },
                    domains: { include: { domain: true } },
                },
                orderBy: {
                    name: "asc",
                },
            });

            return cards.filter(card => {
                if (card.type !== "UNIT") {
                    return true;
                }

                const prefix = card.name.split(" - ")[0].trim();
                return !legendPrefixes.has(prefix);
            });
        }

        case "CHAMPION": {
            const championPrefixes = await getChampionPrefixes();

            const units = await prisma.card.findMany({
                where: {
                    ...(normalizedQuery && {
                        name: {
                            contains: normalizedQuery,
                            mode: "insensitive",
                        },
                    }),
                    type: "UNIT",
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
                orderBy: {
                    name: "asc",
                },
            });

            return units.filter((card) =>
                championPrefixes.has(card.name.split(" - ")[0].trim())
            );
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

    const cards = await prisma.card.findMany({
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

    return cards.map(card => ({
        ...card,
        domains: card?.domains?.map(d => d?.domain?.name).filter(Boolean) ?? [],
        tags: card?.tags?.map(t => t?.tag?.name).filter(Boolean) ?? [],
    }));
}
