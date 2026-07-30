import { prisma } from '../config/prisma.js';

function normalizeCards(cards = []) {
    const counts = new Map();
    for (const entry of cards) {
        if (!entry || typeof entry.cardId !== 'string') continue;
        const quantity = Number(entry.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) continue;
        counts.set(entry.cardId, (counts.get(entry.cardId) || 0) + quantity);
    }
    return Array.from(counts.entries()).map(([cardId, quantity]) => ({ cardId, quantity }));
}

function validateDeckCards(cardRows, providedCards) {
    const errors = [];
    const getCardIdentity = (card) => (card.cleanName || card.name || card.id || '').trim().toLowerCase();

    const legendCount = cardRows
        .filter((row) => row.card.type === 'LEGEND')
        .reduce((sum, row) => sum + row.quantity, 0);
    if (legendCount !== 1) {
        errors.push(`You must select exactly 1 Legend (currently ${legendCount})`);
    }

    const championCount = cardRows
        .filter((row) => row.card.type === 'UNIT' && row.isChampion)
        .reduce((sum, row) => sum + row.quantity, 0);
    if (championCount !== 1) {
        errors.push(`You must select exactly 1 Champion (currently ${championCount})`);
    }

    const runeCount = cardRows
        .filter((row) => row.card.type === 'RUNE')
        .reduce((sum, row) => sum + row.quantity, 0);
    if (runeCount !== 12) {
        errors.push(`You must have exactly 12 Runes (currently ${runeCount})`);
    }

    const battlefieldCount = cardRows
        .filter((row) => row.card.type === 'BATTLEFIELD')
        .reduce((sum, row) => sum + row.quantity, 0);
    if (battlefieldCount !== 3) {
        errors.push(`You must have exactly 3 Battlefields (currently ${battlefieldCount})`);
    }

    const mainDeckCount = cardRows
        .filter((row) => row.card.type !== 'LEGEND' && row.card.type !== 'RUNE' && row.card.type !== 'BATTLEFIELD')
        .reduce((sum, row) => sum + row.quantity, 0);
    if (mainDeckCount !== 40) {
        errors.push(`Main deck must contain exactly 40 cards including Champion (currently ${mainDeckCount})`);
    }

    const cardCopiesByIdentity = new Map();
    for (const row of cardRows) {
        const identity = getCardIdentity(row.card);
        if (!identity) continue;
        const existing = cardCopiesByIdentity.get(identity);
        if (existing) {
            existing.quantity += row.quantity;
        } else {
            cardCopiesByIdentity.set(identity, {
                name: row.card.name,
                quantity: row.quantity,
            });
        }
    }
    for (const entry of cardCopiesByIdentity.values()) {
        if (entry.quantity > 3) {
            errors.push(`Card "${entry.name}" has ${entry.quantity} copies (maximum 3)`);
        }
    }

    if (providedCards.length !== cardRows.length) {
        errors.push('One or more selected cards could not be found');
    }

    return errors;
}

function parseDescriptionField(description, field) {
    if (typeof description !== 'string') {
        return null;
    }

    const line = description
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.startsWith(`${field}:`));

    if (!line) return null;
    return line.slice(`${field}:`.length).trim() || null;
}

function parseChampionName(description) {
    return parseDescriptionField(description, 'Champion');
}

function parseChampionId(description) {
    return parseDescriptionField(description, 'ChampionId');
}

function getDeckCardCount(deckCards = []) {
    return deckCards.reduce((sum, row) => sum + (Number.isInteger(row.quantity) ? row.quantity : 0), 0);
}

function computeDeckLegality(deck) {
    const championId = parseChampionId(deck.description);
    const championName = parseChampionName(deck.description);
    const rows = (deck.cards || [])
        .filter((row) => row?.card)
        .map((row) => ({
            quantity: row.quantity,
            card: row.card,
            isChampion: championId ? row.card.id === championId : championName ? row.card.name === championName : false,
        }));
    const validationErrors = validateDeckCards(rows, deck.cards || []);
    return {
        isLegal: validationErrors.length === 0,
        errors: validationErrors,
    };
}

function decorateDeck(deck) {
    if (!deck) return deck;
    return {
        ...deck,
        cardCount: getDeckCardCount(deck.cards),
        legality: computeDeckLegality(deck),
    };
}

async function resolveDeckCardsAndValidate(cards, description) {
    const normalizedCards = normalizeCards(cards);
    if (!normalizedCards.length) {
        return { normalizedCards, validationErrors: ['Deck must contain at least one card'] };
    }

    const championId = parseChampionId(description);
    const championName = parseChampionName(description);

    const cardIds = normalizedCards.map((entry) => entry.cardId);
    const dbCards = await prisma.card.findMany({
        where: { id: { in: cardIds } },
        select: {
            id: true,
            name: true,
            cleanName: true,
            type: true,
        },
    });

    const byId = new Map(dbCards.map((card) => [card.id, card]));
    const rows = normalizedCards
        .map((entry) => {
            const card = byId.get(entry.cardId);
            if (!card) return null;
            return {
                ...entry,
                card,
                isChampion: championId ? card.id === championId : championName ? card.name === championName : false,
            };
        })
        .filter(Boolean);

    const validationErrors = validateDeckCards(rows, normalizedCards);
    return { normalizedCards, validationErrors };
}

export async function createDeck(userId, name, description, cards = [], isPublic = false, allowInvalid = false) {
    const { normalizedCards, validationErrors } = await resolveDeckCardsAndValidate(cards, description);
    if (validationErrors.length && !allowInvalid) {
        const error = new Error(validationErrors.join('; '));
        error.status = 400;
        throw error;
    }

    return prisma.$transaction(async (tx) => {
        const newDeck = await tx.deck.create({
            data: {
                ownerId: userId,
                name,
                description,
                isPublic: Boolean(isPublic),
            },
        });

        if (normalizedCards.length) {
            await tx.deckCard.createMany({
                data: normalizedCards.map((entry) => ({
                    deckId: newDeck.id,
                    cardId: entry.cardId,
                    quantity: entry.quantity,
                })),
            });
        }

        const createdDeck = await tx.deck.findUnique({
            where: { id: newDeck.id },
            include: {
                owner: {
                    select: { id: true, username: true },
                },
                _count: {
                    select: { cards: true },
                },
                cards: {
                    include: { card: true },
                },
            },
        });

        return decorateDeck(createdDeck);
    });
}

export async function getDeckById(deckId) {
    const deck = await prisma.deck.findUnique({
        where: {
            id: deckId
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true
                }
            },
            _count: {
                select: { cards: true },
            },
            cards: {
                include: {
                    card: true
                }
            }
        }
    });
    return decorateDeck(deck);
}

export async function getDecksByUserId(userId) {
    const decks = await prisma.deck.findMany({
        where: { ownerId: userId },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: { cards: true },
            },
            cards: {
                include: {
                    card: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return decks.map(decorateDeck);
}

export async function getCommunityDecks() {
    const decks = await prisma.deck.findMany({
        where: { isPublic: true },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: { cards: true },
            },
            cards: {
                include: {
                    card: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return decks.map(decorateDeck);
}

export async function updateDeck(deckId, name, description, cards = [], isPublic = false, allowInvalid = false) {
    const { normalizedCards, validationErrors } = await resolveDeckCardsAndValidate(cards, description);
    if (validationErrors.length && !allowInvalid) {
        const error = new Error(validationErrors.join('; '));
        error.status = 400;
        throw error;
    }

    return prisma.$transaction(async (tx) => {
        await tx.deck.update({
            where: { id: deckId },
            data: {
                name,
                description,
                isPublic: Boolean(isPublic),
            },
        });

        await tx.deckCard.deleteMany({ where: { deckId } });
        if (normalizedCards.length) {
            await tx.deckCard.createMany({
                data: normalizedCards.map((entry) => ({
                    deckId,
                    cardId: entry.cardId,
                    quantity: entry.quantity,
                })),
            });
        }

        const updatedDeck = await tx.deck.findUnique({
            where: { id: deckId },
            include: {
                owner: {
                    select: { id: true, username: true },
                },
                _count: {
                    select: { cards: true },
                },
                cards: {
                    include: { card: true },
                },
            },
        });
        return decorateDeck(updatedDeck);
    });
}

export async function updateDeckVisibility(deckId, isPublic) {
    const deck = await prisma.deck.update({
        where: { id: deckId },
        data: { isPublic: Boolean(isPublic) },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: { cards: true },
            },
            cards: {
                include: {
                    card: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
    });
    return decorateDeck(deck);
}

export async function copyDeck(sourceDeck, userId, newName) {
    return prisma.$transaction(async (tx) => {
        const copied = await tx.deck.create({
            data: {
                ownerId: userId,
                name: newName,
                description: sourceDeck.description,
                isPublic: false,
                format: sourceDeck.format,
            },
        });

        if (sourceDeck.cards.length) {
            await tx.deckCard.createMany({
                data: sourceDeck.cards.map((row) => ({
                    deckId: copied.id,
                    cardId: row.cardId,
                    quantity: row.quantity,
                })),
            });
        }

        const copiedDeck = await tx.deck.findUnique({
            where: { id: copied.id },
            include: {
                owner: {
                    select: { id: true, username: true },
                },
                _count: {
                    select: { cards: true },
                },
                cards: {
                    include: { card: true },
                },
            },
        });
        return decorateDeck(copiedDeck);
    });
}

export async function deleteDeck(deckId) {
    return prisma.deck.delete({
        where: { id: deckId },
    });
}

//Deck Maganement functions

export async function addCardToDeck(deckId, cardId, quantity = 1) {

    return prisma.deckCard.upsert({

        where: {
            deckId_cardId: {
                deckId,
                cardId
            }
        },

        update: {
            quantity: {
                increment: quantity
            }
        },

        create: {
            deckId,
            cardId,
            quantity
        }

    });

}


export async function removeCardFromDeck(deckId, cardId) {

    const deckCard = await prisma.deckCard.findUnique({

        where: {

            deckId_cardId: {

                deckId,
                cardId

            }

        }

    });

    if (!deckCard)
        return;

    if (deckCard.quantity > 1) {

        return prisma.deckCard.update({

            where: {

                deckId_cardId: {

                    deckId,
                    cardId

                }

            },

            data: {

                quantity: {

                    decrement: 1

                }

            }

        });

    }

    return prisma.deckCard.delete({

        where: {

            deckId_cardId: {

                deckId,
                cardId

            }

        }

    });

}