export type CardOption = {
    id: string;
    name: string;
    type: string;
    imageUrl?: string;
    richText?: string;
    domains?: Array<{ domain: { name: string } }>;
    tags?: Array<{ tag: { name: string } }>;
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
