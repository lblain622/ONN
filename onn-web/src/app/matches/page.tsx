"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type UserIdentity = {
    id: string;
    email: string;
    username: string;
};

type MatchPlayer = {
    userId: string;
    seat: number;
    ready: boolean;
    user: {
        id: string;
        username: string;
        email: string;
    };
};

type Match = {
    id: string;
    joinCode: string;
    status: "LOBBY" | "IN_PROGRESS" | "FINISHED";
    maxPlayers: number;
    hostId: string;
    playerCount: number;
    readyCount: number;
    players: MatchPlayer[];
    updatedAt: string;
};

type BoardZone = "hand" | "battlefield";

type MatchBoardCard = {
    id: string;
    ownerId: string;
    ownerSeat: number;
    ownerName: string;
    name: string;
    zone: BoardZone;
    zoneOwnerId: string;
    faceDown: boolean;
};

type MatchBoardState = {
    cards: MatchBoardCard[];
};

const PLAYER_COLORS = ["#f59e0b", "#22d3ee", "#a78bfa", "#4ade80"];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, { credentials: "include", ...init });
    if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Request failed");
    }
    return data as T;
}

function initializeBoardState(match: Match): MatchBoardState {
    const cards = match.players.flatMap((player) =>
        Array.from({ length: 5 }, (_, index) => ({
            id: `${match.id}-${player.userId}-card-${index + 1}`,
            ownerId: player.userId,
            ownerSeat: player.seat,
            ownerName: player.user.username || player.user.email,
            name: `Seat ${player.seat} Card ${index + 1}`,
            zone: "hand" as BoardZone,
            zoneOwnerId: player.userId,
            faceDown: false,
        }))
    );

    return { cards };
}

export default function MatchesPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeMatches, setActiveMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [maxPlayers, setMaxPlayers] = useState("4");
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");
    const [boardStates, setBoardStates] = useState<Record<string, MatchBoardState>>({});
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

    const canStartSelectedMatch = useMemo(() => {
        if (!selectedMatch || !currentUser) return false;
        return (
            selectedMatch.status === "LOBBY" &&
            selectedMatch.hostId === currentUser.id &&
            selectedMatch.playerCount >= 2 &&
            selectedMatch.playerCount <= 4 &&
            selectedMatch.readyCount === selectedMatch.playerCount
        );
    }, [selectedMatch, currentUser]);

    const selectedPlayer = useMemo(
        () => selectedMatch?.players.find((player) => player.userId === currentUser?.id),
        [selectedMatch, currentUser]
    );

    const playerColors = useMemo(() => {
        const colors: Record<string, string> = {};
        if (!selectedMatch) return colors;
        const sortedPlayers = [...selectedMatch.players].sort((left, right) => left.seat - right.seat);
        sortedPlayers.forEach((player, index) => {
            colors[player.userId] = PLAYER_COLORS[index % PLAYER_COLORS.length];
        });
        return colors;
    }, [selectedMatch]);

    const selectedBoard = useMemo(() => {
        if (!selectedMatch || selectedMatch.status !== "IN_PROGRESS") return null;
        return boardStates[selectedMatch.id] || initializeBoardState(selectedMatch);
    }, [boardStates, selectedMatch]);

    const loadData = async (preserveMatchId?: string | null) => {
        const [me, lobbyMatches, startedMatches] = await Promise.all([
            fetchJson<UserIdentity>(`${API_URL}/auth/me`),
            fetchJson<Match[]>(`${API_URL}/matches`),
            fetchJson<Match[]>(`${API_URL}/matches/active`),
        ]);

        setCurrentUser(me);
        setMatches(lobbyMatches);
        setActiveMatches(startedMatches);

        const preferredId = preserveMatchId ?? selectedMatch?.id;
        if (preferredId) {
            const resolved =
                lobbyMatches.find((match) => match.id === preferredId) ||
                startedMatches.find((match) => match.id === preferredId) ||
                null;
            setSelectedMatch(resolved);
        } else {
            setSelectedMatch(lobbyMatches[0] || startedMatches[0] || null);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await loadData();
            } catch (loadError) {
                if (loadError instanceof Error && loadError.message === "UNAUTHORIZED") {
                    router.replace("/");
                    return;
                }
                setError(loadError instanceof Error ? loadError.message : "Failed to load lobbies.");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const withRefresh = async (callback: () => Promise<Match | { message: string }>) => {
        setError("");
        setWorking(true);
        try {
            const response = await callback();
            const matchId = "id" in response ? response.id : null;
            await loadData(matchId);
            if ("message" in response) {
                setSelectedMatch(null);
            }
        } catch (actionError) {
            if (actionError instanceof Error && actionError.message === "UNAUTHORIZED") {
                router.replace("/");
                return;
            }
            setError(actionError instanceof Error ? actionError.message : "Unable to complete action.");
        } finally {
            setWorking(false);
        }
    };

    const handleCreateLobby = async () => {
        const parsedMax = Number(maxPlayers);
        await withRefresh(() =>
            fetchJson<Match>(`${API_URL}/matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maxPlayers: parsedMax }),
            })
        );
    };

    const handleJoinLobby = async () => {
        const normalizedCode = joinCode.trim();
        if (!normalizedCode) {
            setError("Enter a join code.");
            return;
        }

        await withRefresh(() =>
            fetchJson<Match>(`${API_URL}/matches/${normalizedCode}/join`, {
                method: "POST",
            })
        );
        setJoinCode("");
    };

    const handleLeave = async (matchId: string) => {
        await withRefresh(() =>
            fetchJson<Match | { message: string }>(`${API_URL}/matches/${matchId}/leave`, { method: "POST" })
        );
    };

    const handleReadyToggle = async (matchId: string, ready: boolean) => {
        await withRefresh(() =>
            fetchJson<Match>(`${API_URL}/matches/${matchId}/${ready ? "ready" : "unready"}`, { method: "POST" })
        );
    };

    const handleStart = async (matchId: string) => {
        await withRefresh(() => fetchJson<Match>(`${API_URL}/matches/${matchId}/start`, { method: "POST" }));
    };

    const handleCardDrop = (targetPlayerId: string, targetZone: BoardZone) => {
        if (!selectedMatch || !currentUser || !draggedCardId) return;
        setError("");

        setBoardStates((previous) => {
            const currentBoard = previous[selectedMatch.id] || initializeBoardState(selectedMatch);

            const card = currentBoard.cards.find((candidate) => candidate.id === draggedCardId);
            if (!card || card.ownerId !== currentUser.id) return previous;

            const droppingInOwnSection = targetPlayerId === currentUser.id;
            const droppingInOpponentBattlefield = targetZone === "battlefield" && targetPlayerId !== currentUser.id;
            const canDrop =
                (droppingInOwnSection && (targetZone === "hand" || targetZone === "battlefield")) ||
                droppingInOpponentBattlefield;

            if (!canDrop) {
                setError("You can only move your cards in your section or another player's battlefield.");
                return previous;
            }

            return {
                ...previous,
                [selectedMatch.id]: {
                    ...currentBoard,
                    cards: currentBoard.cards.map((candidate) =>
                        candidate.id === draggedCardId
                            ? {
                                  ...candidate,
                                  zone: targetZone,
                                  zoneOwnerId: targetPlayerId,
                              }
                            : candidate
                    ),
                },
            };
        });

        setDraggedCardId(null);
    };

    const handleFaceDownToggle = (cardId: string) => {
        if (!selectedMatch || !currentUser) return;
        setBoardStates((previous) => {
            const currentBoard = previous[selectedMatch.id] || initializeBoardState(selectedMatch);

            return {
                ...previous,
                [selectedMatch.id]: {
                    ...currentBoard,
                    cards: currentBoard.cards.map((card) =>
                        card.id === cardId && card.ownerId === currentUser.id
                            ? { ...card, faceDown: !card.faceDown }
                            : card
                    ),
                },
            };
        });
    };

    if (loading) {
        return <div className="min-h-screen bg-darkblue p-8 text-white">Loading lobbies...</div>;
    }

    return (
        <div className="min-h-screen bg-darkblue px-4 py-8 text-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-semibold">Lobbies</h1>
                        <p className="text-sm text-zinc-400">Create, join, and manage matches with 2–4 players.</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-md border border-gold/40 px-4 py-2 text-sm hover:bg-gold/10"
                        onClick={() => router.push("/decks")}
                    >
                        Back to Decks
                    </button>
                </div>

                {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-gold/20 bg-black/80 p-4">
                        <h2 className="text-lg font-medium">Create Lobby</h2>
                        <div className="mt-3 flex items-end gap-3">
                            <label className="flex flex-col gap-1 text-sm">
                                Max Players
                                <select
                                    className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2"
                                    value={maxPlayers}
                                    onChange={(event) => setMaxPlayers(event.target.value)}
                                    disabled={working}
                                >
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                            </label>
                            <button
                                type="button"
                                className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                                disabled={working}
                                onClick={handleCreateLobby}
                            >
                                Create
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gold/20 bg-black/80 p-4">
                        <h2 className="text-lg font-medium">Join Lobby</h2>
                        <div className="mt-3 flex gap-3">
                            <input
                                value={joinCode}
                                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                                placeholder="Join code"
                                className="flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm uppercase"
                                disabled={working}
                            />
                            <button
                                type="button"
                                className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                                disabled={working}
                                onClick={handleJoinLobby}
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-gold/20 bg-black/80 p-4 lg:col-span-1">
                        <h2 className="text-lg font-medium">Your Lobbies</h2>
                        <div className="mt-3 space-y-2">
                            {[...matches, ...activeMatches].map((match) => (
                                <button
                                    key={match.id}
                                    type="button"
                                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                                        selectedMatch?.id === match.id
                                            ? "border-gold bg-gold/10"
                                            : "border-zinc-700 hover:border-zinc-500"
                                    }`}
                                    onClick={() => setSelectedMatch(match)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Code: {match.joinCode}</span>
                                        <span className="text-xs text-zinc-400">{match.status.replace("_", " ")}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {match.playerCount}/{match.maxPlayers} players
                                    </div>
                                </button>
                            ))}
                            {!matches.length && !activeMatches.length && (
                                <p className="text-sm text-zinc-400">No lobbies yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gold/20 bg-black/80 p-4 lg:col-span-2">
                        {!selectedMatch ? (
                            <p className="text-sm text-zinc-400">Select a lobby to manage players and ready state.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-medium">Lobby {selectedMatch.joinCode}</h2>
                                        <p className="text-sm text-zinc-400">
                                            {selectedMatch.playerCount}/{selectedMatch.maxPlayers} players • {selectedMatch.readyCount} ready
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMatch.status === "LOBBY" && selectedPlayer && (
                                            <button
                                                type="button"
                                                className="rounded-md border border-zinc-500 px-3 py-2 text-sm disabled:opacity-50"
                                                disabled={working}
                                                onClick={() => handleReadyToggle(selectedMatch.id, !selectedPlayer.ready)}
                                            >
                                                {selectedPlayer.ready ? "Unready" : "Ready"}
                                            </button>
                                        )}
                                        {selectedMatch.status === "LOBBY" && canStartSelectedMatch && (
                                            <button
                                                type="button"
                                                className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                                                disabled={working}
                                                onClick={() => handleStart(selectedMatch.id)}
                                            >
                                                Start Match
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="rounded-md border border-red-500/50 px-3 py-2 text-sm text-red-300 disabled:opacity-50"
                                            disabled={working}
                                            onClick={() => handleLeave(selectedMatch.id)}
                                        >
                                            Leave
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-md border border-zinc-700">
                                    <div className="grid grid-cols-[80px_1fr_80px_80px] border-b border-zinc-700 px-3 py-2 text-xs uppercase text-zinc-400">
                                        <span>Seat</span>
                                        <span>Player</span>
                                        <span>Host</span>
                                        <span>Ready</span>
                                    </div>
                                    {selectedMatch.players.map((player) => (
                                        <div
                                            key={player.userId}
                                            className="grid grid-cols-[80px_1fr_80px_80px] px-3 py-2 text-sm border-b border-zinc-800 last:border-0"
                                        >
                                            <span>{player.seat}</span>
                                            <span>{player.user.username || player.user.email}</span>
                                            <span>{selectedMatch.hostId === player.userId ? "Yes" : "No"}</span>
                                            <span>{player.ready ? "Yes" : "No"}</span>
                                        </div>
                                    ))}
                                </div>

                                {selectedMatch.status === "IN_PROGRESS" && selectedBoard && (
                                    <div className="space-y-4 rounded-md border border-zinc-700 bg-zinc-950/60 p-4">
                                        <h3 className="text-lg font-medium">Match Board</h3>
                                        <p className="text-xs text-zinc-400">
                                            Drag your cards to your hand/battlefield or another player&apos;s battlefield.
                                        </p>
                                        <div className="grid gap-4">
                                            {[...selectedMatch.players]
                                                .sort((left, right) => left.seat - right.seat)
                                                .map((player) => {
                                                    const color = playerColors[player.userId] || "#f59e0b";
                                                    const handCards = selectedBoard.cards.filter(
                                                        (card) => card.zone === "hand" && card.zoneOwnerId === player.userId
                                                    );
                                                    const battlefieldCards = selectedBoard.cards.filter(
                                                        (card) =>
                                                            card.zone === "battlefield" && card.zoneOwnerId === player.userId
                                                    );
                                                    const isCurrentPlayer = player.userId === currentUser?.id;

                                                    return (
                                                        <div
                                                            key={player.userId}
                                                            className="rounded-lg border p-3"
                                                            style={{
                                                                borderColor: `${color}80`,
                                                                backgroundColor: `${color}14`,
                                                            }}
                                                        >
                                                            <div className="mb-2 flex items-center justify-between text-sm">
                                                                <span className="font-semibold" style={{ color }}>
                                                                    Seat {player.seat}: {player.user.username || player.user.email}
                                                                </span>
                                                                <span className="text-zinc-400">Owner color</span>
                                                            </div>

                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                <div
                                                                    className="rounded-md border border-zinc-700 bg-black/50 p-3"
                                                                    onDragOver={(event) => event.preventDefault()}
                                                                    onDrop={(event) => {
                                                                        event.preventDefault();
                                                                        handleCardDrop(player.userId, "hand");
                                                                    }}
                                                                >
                                                                    <p className="mb-2 text-xs uppercase text-zinc-400">Hand</p>
                                                                    {!isCurrentPlayer && (
                                                                        <p className="text-sm text-zinc-500">
                                                                            Hidden hand ({handCards.length} cards)
                                                                        </p>
                                                                    )}
                                                                    {isCurrentPlayer && (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {handCards.map((card) => {
                                                                                const showFace =
                                                                                    !card.faceDown || hoveredCardId === card.id;
                                                                                return (
                                                                                    <div
                                                                                        key={card.id}
                                                                                        draggable
                                                                                        onDragStart={() => setDraggedCardId(card.id)}
                                                                                        onDragEnd={() => setDraggedCardId(null)}
                                                                                        onMouseEnter={() => setHoveredCardId(card.id)}
                                                                                        onMouseLeave={() => setHoveredCardId(null)}
                                                                                        className="w-28 cursor-grab rounded-md border border-zinc-600 bg-zinc-900 p-2 text-xs active:cursor-grabbing"
                                                                                    >
                                                                                        <p className="font-medium text-white">
                                                                                            {showFace ? card.name : "Face-down card"}
                                                                                        </p>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="mt-2 text-[10px] text-gold hover:underline"
                                                                                            onClick={() => handleFaceDownToggle(card.id)}
                                                                                        >
                                                                                            {card.faceDown ? "Set face up" : "Set face down"}
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div
                                                                    className="rounded-md border border-zinc-700 bg-black/50 p-3"
                                                                    onDragOver={(event) => event.preventDefault()}
                                                                    onDrop={(event) => {
                                                                        event.preventDefault();
                                                                        handleCardDrop(player.userId, "battlefield");
                                                                    }}
                                                                >
                                                                    <p className="mb-2 text-xs uppercase text-zinc-400">Battlefield</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {battlefieldCards.map((card) => {
                                                                            const isOwner = card.ownerId === currentUser?.id;
                                                                            const showFace =
                                                                                !card.faceDown ||
                                                                                (isOwner && hoveredCardId === card.id);
                                                                            return (
                                                                                <div
                                                                                    key={card.id}
                                                                                    draggable={isOwner}
                                                                                    onDragStart={() => {
                                                                                        if (!isOwner) return;
                                                                                        setDraggedCardId(card.id);
                                                                                    }}
                                                                                    onDragEnd={() => setDraggedCardId(null)}
                                                                                    onMouseEnter={() => {
                                                                                        if (!isOwner) return;
                                                                                        setHoveredCardId(card.id);
                                                                                    }}
                                                                                    onMouseLeave={() => setHoveredCardId(null)}
                                                                                    className={`w-32 rounded-md border border-zinc-600 p-2 text-xs ${
                                                                                        isOwner ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                                                                                    } bg-zinc-900`}
                                                                                >
                                                                                    <p className="font-medium text-white">
                                                                                        {showFace ? card.name : "Face-down card"}
                                                                                    </p>
                                                                                    <p className="mt-1 text-[10px] text-zinc-400">
                                                                                        Owner: {card.ownerName}
                                                                                    </p>
                                                                                    {isOwner && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="mt-2 text-[10px] text-gold hover:underline"
                                                                                            onClick={() => handleFaceDownToggle(card.id)}
                                                                                        >
                                                                                            {card.faceDown ? "Set face up" : "Set face down"}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {!battlefieldCards.length && (
                                                                            <p className="text-sm text-zinc-500">No cards in battlefield.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
