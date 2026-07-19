import { prisma } from '../config/prisma.js';

export async function createDeck(userId, name, description, isPublic = false) {
    const newDeck = await prisma.deck.create({
        data: {
            ownerId: userId,
            name,
            description,
            isPublic,
        },
    });
    return newDeck;
}

export async function getDeckById(deckId) {

    return prisma.deck.findUnique({

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

            cards: {

                include: {

                    card: true

                }

            }

        }

    });

}

export async function getDecksByUserId(userId) {
    return prisma.deck.findMany({
        where: { ownerId: userId },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getPublicDecks() {
    return prisma.deck.findMany({
        where: { isPublic: true },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            cards: {
                include: {
                    card: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function updateDeck(deckId, name, description, isPublic) {
    return prisma.deck.update({
        where: { id: deckId },
        data: {
            name,
            description,
            isPublic,
        },
    });
}

export async function deleteDeck(deckId) {
    return prisma.deck.delete({
        where: { id: deckId },
    });
}

export async function copyDeck(userId, sourceDeckId, preferredName) {
    const sourceDeck = await prisma.deck.findUnique({
        where: { id: sourceDeckId },
        include: {
            cards: true,
        },
    });

    if (!sourceDeck) {
        throw new Error('Deck not found');
    }

    const baseName = (preferredName || sourceDeck.name || 'My copy').trim();

    let candidateName = baseName;
    let suffix = 2;

    while (await prisma.deck.findFirst({
        where: {
            ownerId: userId,
            name: {
                equals: candidateName,
                mode: 'insensitive',
            },
        },
        select: { id: true },
    })) {
        candidateName = `${baseName} ${suffix}`;
        suffix += 1;
    }

    return prisma.$transaction(async (tx) => {
        const copiedDeck = await tx.deck.create({
            data: {
                ownerId: userId,
                name: candidateName,
                description: sourceDeck.description,
                format: sourceDeck.format,
                isPublic: false,
            },
        });

        if (sourceDeck.cards.length > 0) {
            await tx.deckCard.createMany({
                data: sourceDeck.cards.map((deckCard) => ({
                    deckId: copiedDeck.id,
                    cardId: deckCard.cardId,
                    quantity: deckCard.quantity,
                })),
            });
        }

        return copiedDeck;
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