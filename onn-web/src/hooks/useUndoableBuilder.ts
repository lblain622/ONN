// hooks/useUndoableBuilder.ts
import {useCallback, useEffect, useState} from "react";
import {BuilderState} from "@/components/deckbuilder/types";

export function useUndoableBuilder(
    builder: BuilderState,
    setBuilder: (state: BuilderState) => void
) {
    const [history, setHistory] = useState<BuilderState[]>([builder]);
    const [index, setIndex] = useState(0);

    // Update history when builder changes externally
    useEffect(() => {
        const currentState = history[index];
        if (JSON.stringify(currentState) !== JSON.stringify(builder)) {
            const newHistory = history.slice(0, index + 1);
            setHistory([...newHistory, builder]);
            setIndex(index + 1);
        }
    }, [builder]);

    const undo = useCallback(() => {
        if (index > 0) {
            const newIndex = index - 1;
            setIndex(newIndex);
            setBuilder(history[newIndex]);
        }
    }, [index, history, setBuilder]);

    const redo = useCallback(() => {
        if (index < history.length - 1) {
            const newIndex = index + 1;
            setIndex(newIndex);
            setBuilder(history[newIndex]);
        }
    }, [index, history, setBuilder]);

    // Reset history when deck changes
    const resetHistory = useCallback((newBuilder: BuilderState) => {
        setHistory([newBuilder]);
        setIndex(0);
    }, []);

    return {
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
        resetHistory,
        currentIndex: index,
        historyLength: history.length,
    };
}
