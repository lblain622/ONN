"use client";

import {use, useState} from "react";
import {useRouter} from "next/navigation";
import {Alert, Button, Input} from "@heroui/react";
import {Redo2, Save, Undo2} from "lucide-react";
import {BuilderState} from "@/components/deckbuilder/types";
import {DeckHeader} from "@/components/deckbuilder/DeckHeader";
import {DeckRules} from "@/components/deckbuilder/DeckRules";

import {DeckStatsSidebar} from "@/components/deckbuilder/DeckStatsSidebar";
import {SearchPanel} from "@/components/deckbuilder/SearchPanel";
import {DeckListPanel} from "@/components/deckbuilder/DeckListPanel";
import {ZonesPanel} from "@/components/deckbuilder/ZonesPanel";
import {DeckBuilderLayout} from "@/components/deckbuilder/DeckBuilderLayout";
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
    const {id} = use(params);
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
    const {undo, redo, canUndo, canRedo} = useUndoableBuilder(builder, setBuilder);

    const [targetSection, setTargetSection] = useState<keyof BuilderState>("mainDeck");

    const handleOpenSearch = (section: keyof BuilderState) => {
        setTargetSection(section);
    };

    const handleAddCopy = (cardId: string) => {
        // Find the first card with this ID in selectedCards and add a copy
        const cardToAdd = builder.mainDeck.selectedCards.find(c => c.id === cardId);
        if (cardToAdd) {
            handleSelect("mainDeck", cardToAdd);
        }
    };

    if (loading) {
        return <LoadingScreen/>;
    }

    const header = (
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
                                startContent={!isSaving && <Save size={20}/>}
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
    );

    const leftPanel = (
        <SearchPanel
            targetSection={targetSection}
            builder={builder}
            onSearch={handleSearch}
            onSelect={handleSelect}
        />
    );

    const rightPanel = (
        <div className="space-y-6">
            <DeckListPanel
                selectedCards={builder.mainDeck.selectedCards}
                isReadOnly={isReadOnly}
                onRemove={(cid) => handleRemove("mainDeck", cid)}
                onAdd={!isReadOnly ? handleAddCopy : undefined}
            />
        </div>
    );

    const bottomPanel = (
        <ZonesPanel
            legend={builder.legend.selectedCards[0]}
            champion={builder.champion.selectedCards[0]}
            runes={builder.runes.selectedCards}
            battlefields={builder.battlefields.selectedCards}
            isReadOnly={isReadOnly}
            onOpenSearch={handleOpenSearch}
            onRemove={handleRemove}
        />
    );

    const rightSidebar = (
        <div className="space-y-4">
            <DeckStatsSidebar
                mainDeckCount={builder.mainDeck.selectedCards.length}
                runeCount={builder.runes.selectedCards.length}
                battlefieldCount={builder.battlefields.selectedCards.length}
                isValid={validation.isValid}
                validationErrors={validation.errors}
                validationWarnings={validation.warnings}
            />
            {!isReadOnly && <DeckRules/>}
        </div>
    );

    return (
        <DeckBuilderLayout
            header={header}
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            rightSidebar={rightSidebar}
            bottomPanel={bottomPanel}
        />
    );
}
