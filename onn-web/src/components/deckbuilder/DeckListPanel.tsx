import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  ScrollShadow,
} from "@heroui/react";
import { Plus, Minus, X, Search } from "lucide-react";

import { CardOption } from "./types";

type DeckListPanelProps = {
  selectedCards: CardOption[];
  isReadOnly: boolean;
  onRemove: (cardId: string) => void;
  onAdd?: (cardId: string) => void;
};

interface GroupedCard {
  card: CardOption;
  count: number;
}

export function DeckListPanel({
  selectedCards,
  isReadOnly,
  onRemove,
  onAdd,
}: DeckListPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const groupedCards = useMemo(() => {
    const map = new Map<string, GroupedCard>();

    selectedCards.forEach((card) => {
      const existing = map.get(card.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(card.id, { card, count: 1 });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.card.name.localeCompare(b.card.name)
    );
  }, [selectedCards]);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return groupedCards;
    return groupedCards.filter(({ card }) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupedCards, searchTerm]);

  const handleAddCopy = (cardId: string) => {
    onAdd?.(cardId);
  };

  const handleRemoveCopy = (cardId: string) => {
    onRemove(cardId);
  };

  return (
    <Card className="border border-gold/20 bg-black h-fit sticky top-4">
      <CardBody className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
              Main Deck
            </h3>
            <p className="text-xs text-zinc-400">
              {selectedCards.length} / 40 cards ({groupedCards.length} unique)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div
            className="h-1 rounded-full bg-gold/20 overflow-hidden"
            role="progressbar"
            aria-valuenow={selectedCards.length}
            aria-valuemin={0}
            aria-valuemax={40}
          >
            <div
              className={`h-full transition-all duration-300 ${
                selectedCards.length === 40
                  ? "bg-success"
                  : selectedCards.length > 40
                  ? "bg-danger"
                  : "bg-primary"
              }`}
              style={{
                width: `${Math.min((selectedCards.length / 40) * 100, 100)}%`,
              }}
            />
          </div>
          {selectedCards.length > 40 && (
            <p className="text-xs text-danger">
              {selectedCards.length - 40} cards over limit
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div>
          <Input
            placeholder="Filter deck..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
            startContent={<Search size={14} className="text-zinc-400" />}
            endContent={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              ) : null
            }
          />
        </div>

        {/* Card List */}
        {groupedCards.length > 0 ? (
          <ScrollShadow className="max-h-[500px] space-y-1">
            {filteredCards.map(({ card, count }) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-darkblue/50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Count Badge */}
                  <Badge
                    content={count}
                    color={count > 3 ? "danger" : "primary"}
                    size="sm"
                    placement="top-right"
                    className="min-w-6"
                  >
                    <div className="h-6 w-6 rounded bg-darkblue border border-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                      {count}
                    </div>
                  </Badge>

                  {/* Card Name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-white">
                      {card.name}
                    </p>
                    {card.type && (
                      <p className="text-xs text-zinc-500 truncate">
                        {card.type}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isReadOnly && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count < 4 && onAdd && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-success hover:bg-success/20"
                        onPress={() => handleAddCopy(card.id)}
                        title="Add copy"
                      >
                        <Plus size={16} />
                      </Button>
                    )}
                    {count > 1 && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-warning hover:bg-warning/20"
                        onPress={() => handleRemoveCopy(card.id)}
                        title="Remove copy"
                      >
                        <Minus size={16} />
                      </Button>
                    )}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-danger hover:bg-danger/20"
                      onPress={() => {
                        for (let i = 0; i < count; i++) {
                          onRemove(card.id);
                        }
                      }}
                      title="Remove all copies"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </ScrollShadow>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-zinc-400">
            <div className="text-3xl">🃏</div>
            <p className="text-sm">Your deck is empty</p>
          </div>
        )}

        {filteredCards.length === 0 && searchTerm && (
          <div className="text-center py-4 text-zinc-400 text-sm">
            No cards match "{searchTerm}"
          </div>
        )}
      </CardBody>
    </Card>
  );
}
