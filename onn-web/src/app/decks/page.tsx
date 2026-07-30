"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
    Alert,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    Dropdown,
    Input, Label,
    Skeleton,
    Tabs,
} from "@heroui/react";
import {
  Clock,
  Copy,
  Edit,
  Eye,
  Filter,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Deck = {
    id: string;
    name: string;
    description: string | null;
    format: string;
    createdAt: string;
    updatedAt?: string;
    isPublic?: boolean;
    owner?: {
        id: string;
        username: string;
    };
    cardCount?: number;
    legality?: {
        isLegal: boolean;
        errors?: string[];
    };
    _count?: {
        cards: number;
    };
};

type DeckDetails = {
    legend: string;
    champion: string;
    sections: string[];
    notes: string[];
};

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

function parseDeckDetails(description: string | null): DeckDetails {
    const lines = (description || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.reduce<DeckDetails>(
        (accumulator, line) => {
            if (line.startsWith("Legend:")) {
                accumulator.legend = line.replace(/^Legend:\s*/, "");
            } else if (line.startsWith("Champion:")) {
                accumulator.champion = line.replace(/^Champion:\s*/, "");
            } else if (line.startsWith("Main deck") || line.startsWith("Runes") || line.startsWith("Battlefields")) {
                accumulator.sections.push(line);
            } else if (!line.startsWith("Deck builder rules")) {
                accumulator.notes.push(line);
            }
            return accumulator;
        },
        {legend: "", champion: "", sections: [], notes: []}
    );
}

function DeckSkeleton() {
    return (
        <Card className="h-full border border-gold/20 bg-black/90">
            <CardHeader className="flex items-start justify-between gap-3 px-6 pb-0 pt-6">
                <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 rounded-lg"/>
                    <Skeleton className="mt-2 h-4 w-1/2 rounded-lg"/>
                </div>
                <Skeleton className="h-6 w-16 rounded-full"/>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-lg"/>
                    <Skeleton className="h-4 w-3/4 rounded-lg"/>
                </div>
                <div className="mt-5 flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-lg"/>
                    <Skeleton className="h-8 w-20 rounded-lg"/>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DecksPage() {
    const router = useRouter();

    // State
    const [decks, setDecks] = useState<Deck[]>([]);
    const [communityDecks, setCommunityDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<string>("my-decks");
    const [isCopying, setIsCopying] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState("");
    const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Load decks
    useEffect(() => {
        async function loadDecks() {
            try {
                const response = await fetch(`${API_URL}/decks/my`, {
                    method: "GET",
                    credentials: "include",
                });

                if (response.status === 401) {
                    router.replace("/");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to load your decks right now.");
                }

                const data = (await response.json()) as Deck[];
                setDecks(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load your decks right now.");
            } finally {
                setIsLoading(false);
            }
        }

        async function loadCommunityDecks() {
            try {
                const response = await fetch(`${API_URL}/decks/community`, {
                    method: "GET",
                    credentials: "include",
                });

                if (response.ok) {
                    const data = (await response.json()) as Deck[];
                    setCommunityDecks(data);
                }
            } catch {
                setCommunityDecks([]);
            } finally {
                setIsLoadingCommunity(false);
            }
        }

        loadDecks();
        loadCommunityDecks();
    }, [router]);

    // Filter and sort decks
    const filteredAndSortedDecks = useMemo(() => {
        const decksToFilter = activeTab === "my-decks" ? decks : communityDecks;

        // Filter
        const filtered = decksToFilter.filter(deck =>
            deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (deck.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (deck.owner?.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [decks, communityDecks, activeTab, searchTerm, sortBy]);

    const canShowCommunityDecks = useMemo(() => communityDecks.length > 0, [communityDecks.length]);

    // Handlers
    const handleCopyDeck = async (deck: Deck) => {
        setIsCopying(deck.id);
        setError("");

        try {
            const response = await fetch(`${API_URL}/decks/${deck.id}/copy`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({name: `${deck.name} (Copy)`}),
            });

            if (!response.ok) {
                throw new Error("Unable to copy this deck right now.");
            }

            const copiedDeck = (await response.json()) as Deck;
            setDecks((current) => [copiedDeck, ...current]);
            setActiveTab("my-decks");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to copy this deck right now.");
        } finally {
            setIsCopying(null);
        }
    };

    const handleDeleteDeck = async () => {
        if (!deckToDelete) return;

        setIsDeleting(deckToDelete.id);
        setDeleteError("");

        try {
            const response = await fetch(`${API_URL}/decks/${deckToDelete.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Unable to delete this deck.");
            }

            setDecks((current) => current.filter((d) => d.id !== deckToDelete.id));
            setDeckToDelete(null);
            setIsDeleteModalOpen(false);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Unable to delete this deck.");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleToggleVisibility = async (deck: Deck) => {
        const nextVisibility = !Boolean(deck.isPublic);
        setIsUpdatingVisibility(deck.id);
        setError("");

        try {
            const response = await fetch(`${API_URL}/decks/${deck.id}/share`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({isPublic: nextVisibility}),
            });

            if (!response.ok) {
                throw new Error("Unable to update deck visibility right now.");
            }

            const updatedDeck = (await response.json()) as Deck;
            setDecks((current) =>
                current.map((existing) =>
                    existing.id === deck.id
                        ? {...existing, isPublic: updatedDeck.isPublic}
                        : existing
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update deck visibility right now.");
        } finally {
            setIsUpdatingVisibility(null);
        }
    };

    const handleLogout = async () => {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        router.replace("/");
    };

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleTabChange = (key: React.Key) => {
        setActiveTab(String(key));
        setSearchTerm("");
    };

    const handleSortChange = (keys: Set<React.Key> | "all") => {
        if (keys === "all") return;
        const selected = Array.from(keys).pop() as SortOption;
        if (selected) setSortBy(selected);
    };

    const openDeleteModal = (deck: Deck) => {
        setDeckToDelete(deck);
        setDeleteError("");
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeckToDelete(null);
        setDeleteError("");
        setIsDeleteModalOpen(false);
    };

    // Render deck card
    const renderDeckCard = (deck: Deck, isCommunity = false) => {
        const details = parseDeckDetails(deck.description);
        const cardCount = deck._count?.cards || deck.cardCount || 0;
        const isCopyingThis = isCopying === deck.id;
        const isDeletingThis = isDeleting === deck.id;
        const isUpdatingVisibilityThis = isUpdatingVisibility === deck.id;

        return (
            <Card
                key={deck.id}
                className="h-full border border-gold/20 bg-black/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange hover:shadow-gold/10"
            >
                <CardHeader className="flex items-start justify-between gap-3 px-6 pb-0 pt-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold truncate">{deck.name}</h2>
                            {(isCommunity || deck.isPublic) && <Globe size={16} className="text-gold flex-shrink-0"/>}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                            {isCommunity
                                ? `By ${deck.owner?.username || "Community"}`
                                : deck.description
                                    ? deck.description.split(/\r?\n/)[0]
                                    : "No description provided."}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full border border-gold/20 px-2 py-1 text-xs text-zinc-300">
                        {isCommunity ? <Users size={12}/> : <Lock size={12}/>}
                        <span>{isCommunity ? "Public" : deck.format || "Standard"}</span>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 pt-4">
                    <div className="space-y-2 text-sm">
                        <p className="text-zinc-300 flex items-center gap-2">
                            <span className="font-medium text-gold">Legend:</span>
                            <span className="truncate">{details.legend || "Not selected"}</span>
                        </p>
                        <p className="text-zinc-300 flex items-center gap-2">
                            <span className="font-medium text-gold">Champion:</span>
                            <span className="truncate">{details.champion || "Not selected"}</span>
                        </p>
                        {cardCount > 0 && <p className="text-xs text-zinc-500">{cardCount} cards</p>}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock size={14}/>
                            <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
                        </div>

                        {isCommunity ? (
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" isIconOnly onPress={() => router.push(`/decks/${deck.id}`)}>
                                    <Eye size={16}/>
                                </Button>
                                <Button size="sm" variant="primary" isDisabled={isCopyingThis} onPress={() => handleCopyDeck(deck)}>
                                    {isCopyingThis ? <Loader2 size={14} className="animate-spin"/> : <Copy size={14}/>}
                                    <span className="ml-1">{isCopyingThis ? "Copying..." : "Copy"}</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" isIconOnly onPress={() => router.push(`/decks/${deck.id}`)}>
                                    <Edit size={16}/>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger-soft"
                                    isIconOnly
                                    isDisabled={isDeletingThis}
                                    onPress={() => openDeleteModal(deck)}
                                >
                                    {isDeletingThis ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={16}/>}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    isDisabled={isUpdatingVisibilityThis}
                                    onPress={() => handleToggleVisibility(deck)}
                                >
                                    {isUpdatingVisibilityThis ? <Loader2 size={14} className="animate-spin"/> :
                                        (deck.isPublic ? <Globe size={14}/> : <Lock size={14}/>)}
                                    <span className="ml-1">{isUpdatingVisibilityThis ? "Saving..." : deck.isPublic ? "Public" : "Private"}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Render deck list
    const renderDeckList = (deckList: Deck[], isCommunity = false) => {
        if (deckList.length === 0) {
            return (
                <div className="rounded-2xl border border-gold/20 bg-black p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4 opacity-50">
                        {isCommunity ? "🌐" : "🃏"}
                    </div>
                    <h2 className="text-2xl font-semibold">
                        {isCommunity ? "No public decks yet" : "No decks yet"}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                        {isCommunity
                            ? "Community decks will appear here when players share their creations with the world."
                            : "Create your first deck and it will appear here. Click the 'Create deck' button to get started."}
                    </p>
                    {!isCommunity && (
                        <Button
                            variant="primary"
                            className="mt-6"
                            onPress={() => router.push("/decks/new")}
                        >
                            <Plus size={16}/>
                            Create Your First Deck
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {deckList.map((deck) => renderDeckCard(deck, isCommunity))}
            </div>
        );
    };

    // Loading skeletons
    const renderSkeletons = () => (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <DeckSkeleton key={i}/>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-darkblue px-4 py-8 text-white">
            <div className="mx-auto max-w-7xl flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">🃏</div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                                    Riftbound
                                </p>
                                <h1 className="text-3xl font-semibold">My Decks</h1>
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                            {activeTab === "my-decks"
                                ? `${decks.length} decks in your collection`
                                : `${communityDecks.length} decks shared by the community`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="secondary"
                            onPress={() => router.push("/matches")}
                        >
                            <Users size={16}/>
                            Lobbies
                        </Button>
                        <Button
                            variant="primary"
                            onPress={() => router.push("/decks/new")}
                        >
                            <Plus size={16}/>
                            Create deck
                        </Button>
                        <Button
                            variant="ghost"
                            onPress={handleLogout}
                        >
                            <LogOut size={16}/>
                            Sign out
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {(error || deleteError) && (
                    <Alert
                        color="danger"
                        title="Error"
                    >
                        {error || deleteError}
                    </Alert>
                )}

                {/* Search and Sort */}
                <div className="flex flex-wrap gap-4 items-center">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                    />

                    <Input
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search decks..."
                        className="pl-10 pr-10"
                    />

                    {searchTerm && (
                        <Button
                            isIconOnly
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onPress={() => setSearchTerm("")}
                        >
                            ✕
                        </Button>
                    )}

                    <div className="flex gap-2">
                        <Dropdown>
                            <Button
                                size="sm"
                                variant="secondary"
                            >
                                <Filter size={14} />
                                Sort: {sortBy.replace("-", " ")}
                            </Button>

                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    selectionMode="single"
                                    selectedKeys={new Set([sortBy])}
                                    onSelectionChange={handleSortChange}
                                >
                                    <Dropdown.Item id="newest" textValue="Newest first">
                                        <Label>Newest first</Label>
                                    </Dropdown.Item>

                                    <Dropdown.Item id="oldest" textValue="Oldest first">
                                        <Label>Oldest first</Label>
                                    </Dropdown.Item>

                                    <Dropdown.Item id="name-asc" textValue="Name (A-Z)">
                                        <Label>Name (A-Z)</Label>
                                    </Dropdown.Item>

                                    <Dropdown.Item id="name-desc" textValue="Name (Z-A)">
                                        <Label>Name (Z-A)</Label>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                </div>

                {/* Tabs */}

                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={handleTabChange}
                    >
                        <Tabs.List>
                            <Tabs.Tab id="my-decks">
                                <span>My Decks</span>
                                <Badge>{decks.length}</Badge>
                            </Tabs.Tab>

                            <Tabs.Tab id="community">
                                <span>Community</span>
                                <Badge>{communityDecks.length}</Badge>
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel id="my-decks"> </Tabs.Panel>
                        <Tabs.Panel id="community"> </Tabs.Panel>
                    </Tabs>

                {/* Deck Content */}
                {activeTab === "my-decks" ? (
                    <div className="space-y-4">
                        {isLoading ? (
                            renderSkeletons()
                        ) : (
                            renderDeckList(filteredAndSortedDecks)
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isLoadingCommunity ? (
                            renderSkeletons()
                        ) : !canShowCommunityDecks ? (
                            <div className="rounded-2xl border border-gold/20 bg-black p-12 text-center shadow-sm">
                                <div className="text-6xl mb-4">🌐</div>
                                <h2 className="text-2xl font-semibold">No public decks yet</h2>
                                <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                                    Community decks will appear here when players share their creations.
                                    Be the first to share your deck with the community!
                                </p>
                            </div>
                        ) : (
                            renderDeckList(filteredAndSortedDecks, true)
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && deckToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="max-w-md w-full mx-4">
                            <Card className="border border-danger/20 bg-black shadow-2xl">
                                <CardHeader className="flex gap-3 px-6 pt-6">
                                    <div className="rounded-full bg-danger/10 p-2">
                                        <Trash2 size={24} className="text-danger"/>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Delete Deck</h2>
                                        <p className="text-sm text-zinc-400">This action cannot be undone</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 py-4">
                                    <p className="text-zinc-300">
                                        Are you sure you want to delete <span
                                        className="font-semibold text-white">&quot;{deckToDelete.name}&quot;</span>?
                                        All cards and data associated with this deck will be permanently removed.
                                    </p>
                                    {deleteError && (
                                        <Alert color="danger" title="Error" className="mt-4">
                                            {deleteError}
                                        </Alert>
                                    )}
                                </CardContent>
                                <div className="flex gap-3 px-6 pb-6 pt-2 justify-end">
                                    <Button variant="secondary" onPress={closeDeleteModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="danger"
                                        isDisabled={isDeleting === deckToDelete.id}
                                        onPress={handleDeleteDeck}
                                    >
                                        {isDeleting !== deckToDelete.id && <Trash2 size={16}/>}
                                        {isDeleting === deckToDelete.id ? "Deleting..." : "Delete Deck"}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gold/10 text-center text-xs text-zinc-500">
                    <p>
                        {activeTab === "my-decks"
                            ? `${filteredAndSortedDecks.length} of ${decks.length} decks shown`
                            : `${filteredAndSortedDecks.length} of ${communityDecks.length} community decks shown`}
                        {searchTerm && ` (filtered by ${searchTerm})`}
                    </p>
                </div>
            </div>
        </div>
    );
}
