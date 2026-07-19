import React from "react";
import {Card, CardBody} from "@heroui/react";
import {Copy, Crown, Layers3, Shield, Sparkles,} from "lucide-react";

export function DeckRules() {
    const rules = [
        {
            icon: Crown,
            text: "1 Champion",
        },
        {
            icon: Layers3,
            text: "40 cards in the main deck (including Champion)",
        },
        {
            icon: Sparkles,
            text: "Exactly 12 Rune cards",
        },
        {
            icon: Shield,
            text: "Exactly 3 Battlefields",
        },
        {
            icon: Copy,
            text: "Maximum 3 copies of any card",
        },
    ];

    return (
        <Card
            shadow="sm"
            className="border border-gold/20 bg-black"
        >
            <CardBody className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gold">
                        Deck Rules
                    </h3>

                    <p className="mt-1 text-xs text-gold/80">
                        Your deck must satisfy all of the following requirements.
                    </p>
                </div>

                <div className="space-y-3">
                    {rules.map(({icon: Icon, text}) => (
                        <div
                            key={text}
                            className="flex items-center gap-3 text-sm text-gold"
                        >
                            <Icon size={16} className="shrink-0"/>
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
