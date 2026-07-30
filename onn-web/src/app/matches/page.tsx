"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
