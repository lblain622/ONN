export type CardOption = {
    cost: number;
    id: string;
    name: string;
    type: string;
    imageUrl?: string;
    richText?: string;
    domains: Array<string | { name?: string; domain?: { name?: string } }>;
    tags?: string[];
};

export type SectionState = {
    query: string;
    type: string;
    searchResults: CardOption[];
    selectedCards: CardOption[];
};

export type BuilderState = {
    legend: SectionState;
    champion: SectionState;
    mainDeck: SectionState;
    runes: SectionState;
    battlefields: SectionState;
};
