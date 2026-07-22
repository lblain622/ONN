import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Spinner,
  Tab,
  Tabs,
} from "@heroui/react";
import { Search } from "lucide-react";

import { CardOption } from "./types";
import { SearchCard } from "./SearchCard";

type SearchType =
    | "ALL"
    | "LEGEND"
    | "CHAMPION"
    | "MAIN_DECK"
    | "BATTLEFIELD"
    | "RUNE";

type SearchPanelProps = {
  onSelect: (card: CardOption) => void;
};

const tabs: SearchType[] = [
  "LEGEND",
  "CHAMPION",
  "MAIN_DECK",
  "BATTLEFIELD",
  "RUNE",
];

export function SearchPanel({ onSelect }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] =
      useState<SearchType>("MAIN_DECK");

  const [results, setResults] = useState<CardOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("query", query.trim());
      }

      if (searchType !== "ALL") {
        params.set("type", searchType);
      }

      const response = await fetch(
          `http://localhost:3000/cards/search?${params.toString()}`,
          {
            credentials: "include",
          }
      );

      if (!response.ok) {
        throw new Error("Unable to search cards.");
      }

      const data = await response.json();
      console.log(data);
      console.log(data.filter((c: any) => c === undefined));

      setResults(data);
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Search failed."
      );
    } finally {
      setLoading(false);
    }
  }, [query, searchType]);

  useEffect(() => {
    const timeout = setTimeout(search, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
      <Card className="h-full">
        <CardBody className="flex flex-col gap-4 overflow-hidden">

          <Tabs
              selectedKey={searchType}
              onSelectionChange={(key) =>
                  setSearchType(key as SearchType)
              }
              variant="underlined"
          >
            {tabs.map((tab) => (
                <Tab
                    key={tab}
                    title={tab.replace("_", " ")}
                />
            ))}
          </Tabs>

          <Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search cards..."
              startContent={<Search size={18} />}
              isClearable
          />

          {loading && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
          )}

          {error && (
              <p className="text-danger text-sm">
                {error}
              </p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
            {results.map((card) => (
                <SearchCard
                    key={card.id}
                    card={card}
                    onSelect={() => onSelect(card)}
                />
            ))}
          </div>
        </CardBody>
      </Card>
  );
}
