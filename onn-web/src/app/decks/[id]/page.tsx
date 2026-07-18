"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Alert, Button, Input} from "@heroui/react";
import {Redo2, Save, Undo2} from "lucide-react";
import {BuilderState} from "@/components/deckbuilder/types";
import {DeckHeader} from "@/components/deckbuilder/DeckHeader";
import {DeckRules} from "@/components/deckbuilder/DeckRules";
import {DeckStats} from "@/components/deckbuilder/DeckStats";
import {SearchModal} from "@/components/deckbuilder/SearchModal";
import {LegendZone} from "@/components/deckbuilder/LegendZone";
import {ChampionZone} from "@/components/deckbuilder/ChampionZone";
import {RuneZone} from "@/components/deckbuilder/RuneZone";
import {BattlefieldZone} from "@/components/deckbuilder/BattlefieldZone";
import {MainDeckPanel} from "@/components/deckbuilder/MainDeckPanel";
import {useDeckBuilder} from "@/hooks/useDeckBuilder";
import {useDeckValidation} from "@/hooks/useDeckValidation";
import {useUndoableBuilder} from "@/hooks/useUndoableBuilder";

function LoadingScreen() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-darkblue">
            <div className="text-center">
                <div
                    className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4 text-sm text-zinc-400">Loading deck builder...</p>
            </div>
        </div>
    );
}

export default function DeckPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = params as { id: string };
    const router = useRouter();

    const {
        builder,
        setBuilder,
        deckName,
        setDeckName,
        loading,
        isSaving,
        isReadOnly,
        error: loadError,
        handleSelect,
        handleRemove,
        handleSearch,
        handleSave,
    } = useDeckBuilder(id);

    const validation = useDeckValidation(builder);
    const {state, undo, redo, canUndo, canRedo} = useUndoableBuilder(builder, setBuilder);

    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [targetSection, setTargetSection] = useState<keyof BuilderState>("mainDeck");

    const handleOpenSearch = (section: keyof BuilderState) => {
        setTargetSection(section);
        setSearchModalOpen(true);
    };

    if (loading) {
        return <LoadingScreen/>;
    }

    return (
        <div className="min-h-screen bg-darkblue text-white pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6">
                        <DeckHeader isReadOnly={isReadOnly} onBack={() => router.push("/decks")}/>

                        {!isReadOnly && (
                            <div
                                className="flex flex-col gap-4 bg-black p-4 rounded-2xl border border-gold/20 shadow-sm">
                                <div
                                    className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                                    <Input
                                        label="Deck Name"
                                        placeholder="Enter deck name..."
                                        value={deckName}
                                        onChange={(e) => setDeckName(e.target.value)}
                                        className="max-w-md"
                                        variant="bordered"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onPress={undo}
                                            isDisabled={!canUndo}
                                            title="Undo"
                                        >
                                            <Undo2 size={18}/>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onPress={redo}
                                            isDisabled={!canRedo}
                                            title="Redo"
                                        >
                                            <Redo2 size={18}/>
                                        </Button>
                                        <Button
                                            color="primary"
                                            size="lg"
                                            startcontent={!isSaving && <Save size={20}/>}
                                            isLoading={isSaving}
                                            onPress={handleSave}
                                            isDisabled={!validation.isValid || isSaving}
                                            className="font-bold px-8"
                                        >
                                            {isSaving ? "Saving..." : "Save Deck"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Validation Errors */}
                                {validation.errors.length > 0 && (
                                    <Alert
                                        color="danger"
                                        title="Deck Invalid"
                                        description={
                                            <ul className="list-disc list-inside text-sm">
                                                {validation.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        }
                                    />
                                )}

                                {/* Validation Warnings */}
                                {validation.warnings.length > 0 && validation.errors.length === 0 && (
                                    <Alert
                                        color="warning"
                                        title="Deck Warnings"
                                        description={
                                            <ul className="list-disc list-inside text-sm">
                                                {validation.warnings.map((warn, i) => (
                                                    <li key={i}>{warn}</li>
                                                ))}
                                            </ul>
                                        }
                                    />
                                )}

                                {/* Load Error */}
                                {loadError && (
                                    <Alert
                                        color="danger"
                                        title="Error"
                                        description={loadError}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <LegendZone
                                    card={builder.legend.selectedCards[0]}
                                    isReadOnly={isReadOnly}
                                    onOpenSearch={() => handleOpenSearch("legend")}
                                    onRemove={(cid) => handleRemove("legend", cid)}
                                />
                                <ChampionZone
                                    card={builder.champion.selectedCards[0]}
                                    isReadOnly={isReadOnly}
                                    onOpenSearch={() => handleOpenSearch("champion")}
                                    onRemove={(cid) => handleRemove("champion", cid)}
                                />
                            </div>

                            <RuneZone
                                cards={builder.runes.selectedCards}
                                isReadOnly={isReadOnly}
                                onOpenSearch={() => handleOpenSearch("runes")}
                                onRemove={(cid) => handleRemove("runes", cid)}
                            />

                            <BattlefieldZone
                                cards={builder.battlefields.selectedCards}
                                isReadOnly={isReadOnly}
                                onOpenSearch={() => handleOpenSearch("battlefields")}
                                onRemove={(cid) => handleRemove("battlefields", cid)}
                            />
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <DeckRules/>
                            <DeckStats builder={builder}/>
                            <MainDeckPanel
                                selectedCards={builder.mainDeck.selectedCards}
                                isReadOnly={isReadOnly}
                                onOpenSearch={() => handleOpenSearch("mainDeck")}
                                onRemove={(cid) => handleRemove("mainDeck", cid)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SearchModal
                isOpen={searchModalOpen}
                onOpenChange={setSearchModalOpen}
                targetSection={targetSection}
                builder={builder}
                onSearch={handleSearch}
                onSelect={handleSelect}
            />
        </div>
    );
}
