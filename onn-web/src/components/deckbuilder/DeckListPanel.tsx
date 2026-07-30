import {Card, CardBody, CardHeader} from "@heroui/react";
import { BuilderState, CardOption } from "./types";
import {useMemo} from "react";
import {DeckRow} from "@/components/deckbuilder/DeckRow";

type DeckPanelProps = {
  builder: BuilderState;
  isReadOnly: boolean;
  onRemove: (
      section: keyof BuilderState,
      cardId: string
  ) => void;
  onAddCopy?: (
      section: keyof BuilderState,
      cardId: string
  ) => void;
};
export function DeckListPanel({builder, isReadOnly,onRemove, onAddCopy}:DeckPanelProps) {
  const groupedMainDeck = useMemo(() => {
    const map = new Map<string, {
      card: CardOption;
      count: number;
    }>();

    builder.mainDeck.selectedCards.forEach(card => {
      const existing = map.get(card.id);

      if (existing) {
        existing.count++;
      } else {
        map.set(card.id, {
          card,
          count: 1,
        });
      }
    });

    return [...map.values()].sort((a, b) => {
      if ((a.card.cost ?? 0) !== (b.card.cost ?? 0)) {
        return (a.card.cost ?? 0) - (b.card.cost ?? 0);
      }

      return a.card.name.localeCompare(b.card.name);
    });
  }, [builder.mainDeck.selectedCards]);

  return (
      <div className="space-y-6">

        {/* Legend + Champion */}
        <div className="grid grid-cols-2 gap-4">

          <Card>

            <CardHeader>
              Legend
            </CardHeader>

            <CardBody>

              {builder.legend.selectedCards[0]
                  ?<DeckRow
                      card={builder.legend.selectedCards[0]}
                      isReadOnly={isReadOnly}
                      onRemove={() =>
                          onRemove("legend", builder.legend.selectedCards[0].id)
                      }
                  />
                  : "No Legend"}

            </CardBody>

          </Card>

          <Card>

            <CardHeader>
              Champion
            </CardHeader>

            <CardBody>

              {builder.champion.selectedCards[0]
                  ? <DeckRow
                      card={builder.champion.selectedCards[0]}
                      isReadOnly={isReadOnly}
                      onRemove={() =>
                          onRemove("champion", builder.champion.selectedCards[0].id)
                      }
                  />
                  : "No Champion"}

            </CardBody>

          </Card>

        </div>
        {/* Main Deck */}
        <Card>

          <CardHeader>

            Main Deck ({builder.mainDeck.selectedCards.length}/40)

          </CardHeader>

          <CardBody className="max-h-[500px] overflow-y-auto space-y-1">

            {groupedMainDeck.map(({card,count})=>(

                <DeckRow
                    key={card.id}
                    card={card}
                    count={count}
                    isReadOnly={isReadOnly}
                    onAdd={
                      onAddCopy
                          ? () => onAddCopy("mainDeck", card.id)
                          : undefined
                    }
                    onRemove={() => onRemove("mainDeck", card.id)}
                />

            ))}

          </CardBody>

        </Card>
        {/* Battlefields */}
        <Card>

          <CardHeader>

            Battlefields

          </CardHeader>

          <CardBody className="max-h-[500px] overflow-y-auto space-y-1">

            {builder.battlefields.selectedCards.map(card=>(

                <DeckRow
                    key={card.id}
                    card={card}
                    isReadOnly={isReadOnly}
                    onRemove={() =>
                        onRemove("battlefields", card.id)
                    }
                />

            ))}

          </CardBody>

        </Card>
        {/* Runes */}
        <Card>

          <CardHeader>

            Runes

          </CardHeader>

          <CardBody className="max-h-[500px] overflow-y-auto space-y-1">

            {builder.runes.selectedCards.map(card=>(

                <DeckRow
                    key={card.id}
                    card={card}
                    isReadOnly={isReadOnly}
                    onRemove={() =>
                        onRemove("runes", card.id)
                    }
                />

            ))}

          </CardBody>

        </Card>
      </div>
  );
}
