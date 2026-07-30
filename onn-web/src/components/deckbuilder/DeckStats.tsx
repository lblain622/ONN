// components/deckbuilder/DeckStats.tsx
import React, {useMemo} from "react";
import {BuilderState} from "./types";

type DeckStatsProps = {
    builder: BuilderState;
    className?: string;
};

export function DeckStats({builder, className = ""}: DeckStatsProps) {
    const stats = useMemo(() => {
        const mainDeckCount = builder.mainDeck.selectedCards.length;
        const championCount = builder.champion.selectedCards.length;
        const runeCount = builder.runes.selectedCards.length;
        const battlefieldCount = builder.battlefields.selectedCards.length;

        const allCards = [
            ...builder.mainDeck.selectedCards,
            ...builder.runes.selectedCards,
            ...builder.battlefields.selectedCards,
        ];

        const typeDistribution: Record<string, number> = {};
        allCards.forEach(card => {
            const type = card.type || 'unknown';
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        });

        return {
            mainDeckCount,
            championCount,
            runeCount,
            battlefieldCount,
            total: mainDeckCount + championCount + runeCount + battlefieldCount,
            unique: new Set(allCards.map(c => c.id)).size,
            typeDistribution,
        };
    }, [builder]);

    const getProgressColor = (current: number, target: number) => {
        if (current === target) return "success";
        if (current > target) return "danger";
        if (current / target >= 0.8) return "warning";
        return "default";
    };

    const getProgressClass = (color: string) => {
        if (color === "success") return "bg-success";
        if (color === "danger") return "bg-danger";
        if (color === "warning") return "bg-warning";
        return "bg-gold/70";
    };

    return (
        <div className={`rounded-xl border border-gold/20 bg-black p-4 ${className}`}>
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gold">Deck Statistics</h4>
                    <p className="text-xs text-zinc-400">Overview of your deck composition</p>
                </div>

                <div className="space-y-3">
                    {/* Main Deck Progress */}
                    <div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Main Deck</span>
                            <span className={stats.mainDeckCount === 40 ? "text-success" : "text-zinc-400"}>
                                {stats.mainDeckCount}/40
                            </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gold/10">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressClass(getProgressColor(stats.mainDeckCount, 40))}`}
                                style={{width: `${Math.min((stats.mainDeckCount / 40) * 100, 100)}%`}}
                            />
                        </div>
                    </div>

                    {/* Runes Progress */}
                    <div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Runes</span>
                            <span className={stats.runeCount === 12 ? "text-success" : "text-zinc-400"}>
                                {stats.runeCount}/12
                            </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gold/10">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressClass(getProgressColor(stats.runeCount, 12))}`}
                                style={{width: `${Math.min((stats.runeCount / 12) * 100, 100)}%`}}
                            />
                        </div>
                    </div>

                    {/* Battlefields Progress */}
                    <div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Battlefields</span>
                            <span className={stats.battlefieldCount === 3 ? "text-success" : "text-zinc-400"}>
                                {stats.battlefieldCount}/3
                            </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gold/10">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressClass(getProgressColor(stats.battlefieldCount, 3))}`}
                                style={{width: `${Math.min((stats.battlefieldCount / 3) * 100, 100)}%`}}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold/10">
                        <div>
                            <p className="text-xs text-zinc-400">Total Cards</p>
                            <p className="text-lg font-bold text-white">{stats.total}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Unique Cards</p>
                            <p className="text-lg font-bold text-white">{stats.unique}</p>
                        </div>
                    </div>

                    {/* Type Distribution */}
                    {Object.keys(stats.typeDistribution).length > 0 && (
                        <div className="pt-2 border-t border-gold/10">
                            <p className="text-xs text-zinc-400 mb-1">Card Types</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(stats.typeDistribution).map(([type, count]) => (
                                    <div key={type} className="flex items-center gap-1">
                                        <span className="text-xs px-2 py-1 rounded bg-darkblue text-zinc-300">
                                            {type}: {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
