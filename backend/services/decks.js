import { prisma } from '../config/prisma.js';

export async function createDeck(userId, name, description) {
    const newDeck = await prisma.deck.create({
        data: {
            ownerId: userId,
            name,
            description,
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
    });
}

export async function updateDeck(deckId, name, description) {
    return prisma.deck.update({
        where: { id: deckId },
        data: {
            name,
            description,
        },
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