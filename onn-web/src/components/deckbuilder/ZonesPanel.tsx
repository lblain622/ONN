import React from "react";
import { Button } from "@heroui/react";
import { ScrollText, Wand2, Sparkles, Flame, Plus } from "lucide-react";

import { SelectedCard } from "./SelectedCard";
import { CardOption, BuilderState } from "./types";

type ZonesPanelProps = {
  legend?: CardOption;
  champion?: CardOption;
  runes: CardOption[];
  battlefields: CardOption[];
  isReadOnly: boolean;
  onOpenSearch: (zone: keyof BuilderState) => void;
  onRemove: (zone: keyof BuilderState, cardId: string) => void;
};

export function ZonesPanel({
  legend,
  champion,
  runes,
  battlefields,
  isReadOnly,
  onOpenSearch,
  onRemove,
}: ZonesPanelProps) {
  return (
    <div className="space-y-8">
      {/* Legend and Champion Row */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Legend Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-gold" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                  Legend
                </h3>
                <p className="text-xs text-zinc-400">
                  {legend ? "1/1 Selected" : "No legend selected"}
                </p>
              </div>
            </div>
            {!isReadOnly && !legend && (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Plus size={14} />}
                onPress={() => onOpenSearch("legend")}
              >
                Add
              </Button>
            )}
          </div>

          {legend ? (
            <SelectedCard
              card={legend}
              selectedLabel="Legend"
              readOnly={isReadOnly}
              onRemove={
                isReadOnly
                  ? undefined
                  : () => onRemove("legend", legend.id)
              }
            />
          ) : (
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onOpenSearch("legend")}
              className="
                group
                flex
                aspect-[5/7]
                w-full
                items-center
                justify-center
                rounded-xl
                border-2
                border-dashed
                border-gold/20
                bg-black
                transition-all
                duration-200
                disabled:cursor-default
                disabled:opacity-70
                enabled:hover:border-primary
                enabled:hover:bg-darkblue
              "
            >
              <div className="text-center">
                <ScrollText
                  size={40}
                  className="mx-auto text-zinc-500 group-hover:text-primary transition-colors"
                />
                <p className="mt-2 text-xs font-medium text-zinc-400">
                  Add Legend
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Champion Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 size={18} className="text-primary" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                  Champion
                </h3>
                <p className="text-xs text-zinc-400">
                  {champion ? "1/1 Selected" : "No champion selected"}
                </p>
              </div>
            </div>
            {!isReadOnly && !champion && (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Plus size={14} />}
                onPress={() => onOpenSearch("champion")}
              >
                Add
              </Button>
            )}
          </div>

          {champion ? (
            <SelectedCard
              card={champion}
              selectedLabel="Champion"
              readOnly={isReadOnly}
              onRemove={
                isReadOnly
                  ? undefined
                  : () => onRemove("champion", champion.id)
              }
            />
          ) : (
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onOpenSearch("champion")}
              className="
                group
                flex
                aspect-[5/7]
                w-full
                items-center
                justify-center
                rounded-xl
                border-2
                border-dashed
                border-gold/20
                bg-black
                transition-all
                duration-200
                disabled:cursor-default
                disabled:opacity-70
                enabled:hover:border-primary
                enabled:hover:bg-darkblue
              "
            >
              <div className="text-center">
                <Wand2
                  size={40}
                  className="mx-auto text-zinc-500 group-hover:text-primary transition-colors"
                />
                <p className="mt-2 text-xs font-medium text-zinc-400">
                  Add Champion
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Runes Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-warning" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                Runes
              </h3>
              <p className="text-xs text-zinc-400">
                {runes.length}/12 cards
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Plus size={14} />}
              onPress={() => onOpenSearch("runes")}
            >
              Add Runes
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {runes.map((card) => (
            <SelectedCard
              key={card.id}
              card={card}
              readOnly={isReadOnly}
              className="flex-shrink-0"
              onRemove={
                isReadOnly
                  ? undefined
                  : () => onRemove("runes", card.id)
              }
            />
          ))}
          {!isReadOnly && runes.length < 12 && (
            <button
              type="button"
              onClick={() => onOpenSearch("runes")}
              className="
                group
                flex
                aspect-[5/7]
                items-center
                justify-center
                rounded-xl
                border-2
                border-dashed
                border-gold/20
                bg-black
                transition-all
                duration-200
                hover:border-primary
                hover:bg-darkblue
              "
            >
              <Plus
                size={24}
                className="text-zinc-500 group-hover:text-primary transition-colors"
              />
            </button>
          )}
        </div>
      </div>

      {/* Battlefields Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-danger" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                Battlefields
              </h3>
              <p className="text-xs text-zinc-400">
                {battlefields.length}/3 cards
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Plus size={14} />}
              onPress={() => onOpenSearch("battlefields")}
            >
              Add Battlefields
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {battlefields.map((card) => (
            <SelectedCard
              key={card.id}
              card={card}
              readOnly={isReadOnly}
              className="flex-shrink-0"
              onRemove={
                isReadOnly
                  ? undefined
                  : () => onRemove("battlefields", card.id)
              }
            />
          ))}
          {!isReadOnly && battlefields.length < 3 && (
            <button
              type="button"
              onClick={() => onOpenSearch("battlefields")}
              className="
                group
                flex
                aspect-[5/7]
                items-center
                justify-center
                rounded-xl
                border-2
                border-dashed
                border-gold/20
                bg-black
                transition-all
                duration-200
                hover:border-primary
                hover:bg-darkblue
              "
            >
              <Plus
                size={24}
                className="text-zinc-500 group-hover:text-primary transition-colors"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
