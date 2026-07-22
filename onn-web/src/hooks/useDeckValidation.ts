// hooks/useDeckValidation.ts
import {useMemo} from "react";
import {BuilderState} from "@/components/deckbuilder/types";

type ValidationResult = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
        mainDeckCount: number;
        championCount: number;
        runeCount: number;
        battlefieldCount: number;
        totalCards: number;
        uniqueCards: number;
        duplicateCounts: Map<string, number>;
        cardTypeDistribution: Record<string, number>;
    };
};

export function useDeckValidation(builder: BuilderState): ValidationResult {
    return useMemo(() => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const mainDeckCount = builder.mainDeck.selectedCards.length;
        const championCount = builder.champion.selectedCards.length;
        const runeCount = builder.runes.selectedCards.length;
        const battlefieldCount = builder.battlefields.selectedCards.length;
        const totalCards = mainDeckCount + championCount + runeCount + battlefieldCount;
        //legendCount
        const legendCount = builder.legend.selectedCards.length;

        if (legendCount === 0)
            errors.push("You must select exactly 1 Legend");

        if (legendCount > 1)
            errors.push("You may only have 1 Legend");

        // Champion validation
        if (championCount === 0) {
            errors.push("You must select exactly 1 Champion");
        } else if (championCount > 1) {
            errors.push("You can only have 1 Champion");
        }

        // Main deck validation (including champion)
        const mainDeckTotal = mainDeckCount + championCount;
        if (mainDeckTotal < 40) {
            errors.push(`Main deck needs ${39 - mainDeckTotal} more cards (currently ${mainDeckTotal}/40)`);
        } else if (mainDeckTotal > 40) {
            errors.push(`Main deck has ${mainDeckTotal - 39} too many cards (currently ${mainDeckTotal}/40)`);
        }

        // Rune validation
        if (runeCount < 12) {
            errors.push(`You need ${12 - runeCount} more Runes (currently ${runeCount}/12)`);
        } else if (runeCount > 12) {
            errors.push(`You have ${runeCount - 12} too many Runes (currently ${runeCount}/12)`);
        }

        // Battlefield validation
        if (battlefieldCount < 3) {
            errors.push(`You need ${3 - battlefieldCount} more Battlefields (currently ${battlefieldCount}/3)`);
        } else if (battlefieldCount > 3) {
            errors.push(`You have ${battlefieldCount - 3} too many Battlefields (currently ${battlefieldCount}/3)`);
        }

        // Duplicate validation
        const allCards = [
            ...builder.mainDeck.selectedCards,
            ...builder.champion.selectedCards,
        ];

        const duplicateCounts = new Map<string, number>();

        builder.mainDeck.selectedCards.forEach(card => {
            duplicateCounts.set(card.id,
                (duplicateCounts.get(card.id) ?? 0) + 1);
        });

        duplicateCounts.forEach((count, cardId) => {
            if (count > 3) {
                const card = allCards.find(c => c.id === cardId);
                errors.push(`Card "${card?.name}" has ${count} copies (maximum 3)`);
            }
        });

        // Card type distribution
        const cardTypeDistribution: Record<string, number> = {};
        allCards.forEach(card => {
            const type = card.type || 'unknown';
            cardTypeDistribution[type] = (cardTypeDistribution[type] || 0) + 1;
        });

        // Warnings
        if (mainDeckTotal === 40 && championCount === 1 && runeCount === 12 && battlefieldCount === 3) {
            const hasDuplicates = Array.from(duplicateCounts.values()).some(count => count > 1);
            if (!hasDuplicates && allCards.length > 0) {
                warnings.push("Highlander deck! All cards are unique.");
            }
        }

        //Rune Validation
        const champion = builder.champion.selectedCards[0];

        if (champion) {
            const championDomains = new Set(champion.domains);

            builder.runes.selectedCards.forEach(rune => {
                const valid = rune?.domains.some(domain =>
                    championDomains.has(domain)
                );

                if (!valid) {
                    errors.push(
                        `${rune.name} cannot be used with ${champion.name}`
                    );
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats: {
                mainDeckCount,
                championCount,
                runeCount,
                battlefieldCount,
                totalCards,
                uniqueCards: duplicateCounts.size,
                duplicateCounts,
                cardTypeDistribution,
            },
        };
    }, [builder]);
}
