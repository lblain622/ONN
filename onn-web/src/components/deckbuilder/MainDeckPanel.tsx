import React, {useMemo, useState} from "react";
import {
    Badge,
    Button,
    Card,
    CardBody,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Textarea,
} from "@heroui/react";
import {Search, X} from "lucide-react";

import {CardOption} from "./types";

type MainDeckPanelProps = {
    selectedCards: CardOption[];
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function MainDeckPanel({
                                  selectedCards,
                                  isReadOnly,
                                  onOpenSearch,
                                  onRemove,
                              }: MainDeckPanelProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkInput, setBulkInput] = useState("");

    const groupedCards = useMemo(() => {
        const map = new Map<string, { card: CardOption; count: number }>();

        selectedCards.forEach((card) => {
            const existing = map.get(card.id);
            if (existing) {
                existing.count++;
            } else {
                map.set(card.id, {card, count: 1});
            }
        });

        return [...map.values()]
            .sort((a, b) => a.card.name.localeCompare(b.card.name));
    }, [selectedCards]);

    const filteredCards = useMemo(() => {
        if (!searchTerm.trim()) return groupedCards;
        return groupedCards.filter(({card}) =>
            card.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groupedCards, searchTerm]);

    const handleBulkAdd = () => {
        // Implementation for bulk adding cards
        setBulkModalOpen(false);
        setBulkInput("");
    };

    return (

        <section className="space-y-4">

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                        Main Deck
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {selectedCards.length} / 39 cards
                    </p>
                </div>



            <Card shadow="sm" className="bg-black border border-gold/20">
                <CardBody className="p-0">
                    {groupedCards.length > 0 ? (
                        <>
                            {/* Search bar */}
                            <div className="sticky top-0 z-10 p-3 border-b border-gold/10 bg-black/90 backdrop-blur-sm">
                                <Input
                                    placeholder="Search cards in deck..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    size="sm"
                                    startContent={<Search size={16} className="text-zinc-400"/>}
                                    endContent={
                                        searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm("")}
                                                className="text-zinc-400 hover:text-white"
                                            >
                                                <X size={16}/>
                                            </button>
                                        )
                                    }
                                />
                            </div>

                            {/* Card list */}
                            <div className="max-h-[500px] divide-y divide-gold/10 overflow-y-auto">
                                {filteredCards.map(({card, count}) => (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-darkblue transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <Badge
                                                content={count}
                                                color={count > 3 ? "danger" : "primary"}
                                                size="sm"
                                                placement="top-right"
                                            >
                                                <div
                                                    className="h-8 w-8 rounded-lg bg-darkblue flex items-center justify-center text-sm font-semibold text-gold">
                                                    {count}×
                                                </div>
                                            </Badge>
                                            <span className="font-medium truncate">
                                                {card.name}
                                            </span>
                                            {card.type && (
                                                <span className="text-xs text-zinc-400 hidden sm:inline">
                                                    {card.type}
                                                </span>
                                            )}
                                        </div>

                                        {!isReadOnly && (
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onPress={() => onRemove(card.id)}
                                                isIconOnly
                                                className="shrink-0 ml-2"
                                            >
                                                <X size={16}/>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {filteredCards.length === 0 && searchTerm && (
                                <div className="p-8 text-center text-zinc-400">
                                    <p>No cards found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                            <div className="text-5xl opacity-40">🃏</div>
                            <p className="text-zinc-400">
                                Your main deck is empty.
                            </p>
                            {!isReadOnly && (
                                <Button
                                    color="primary"
                                    variant="flat"
                                    onPress={onOpenSearch}
                                >
                                    Add Cards
                                </Button>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Bulk Add Modal */}
            <Modal
                isOpen={bulkModalOpen}
                onOpenChange={setBulkModalOpen}
                size="lg"
            >
                <ModalContent>
                    <ModalHeader>Bulk Add Cards</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500">
                            Enter card names one per line. Cards will be added if they exist in the database.
                        </p>
                        <Textarea
                            placeholder={"Card Name 1\nCard Name 2\nCard Name 3"}
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            className="mt-2"
                            minRows={6}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setBulkModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleBulkAdd}>
                            Add Cards
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </section>
    );
}
