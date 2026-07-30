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
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Skeleton,
  Tab,
  Tabs,
  Tooltip
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
  SortAsc,
  SortDesc,
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
        let filtered = decksToFilter.filter(deck =>
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

    const handleSortChange = (keys: any) => {
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
                            {isCommunity && (
                                <Tooltip content="Public deck">
                                    <Globe size={16} className="text-primary flex-shrink-0"/>
                                </Tooltip>
                            )}
                            {!isCommunity && deck.isPublic && (
                                <Tooltip content="Publicly shared">
                                    <Globe size={16} className="text-gold flex-shrink-0"/>
                                </Tooltip>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                            {isCommunity
                                ? `By ${deck.owner?.username || "Community"}`
                                : deck.description
                                    ? deck.description.split(/\r?\n/)[0]
                                    : "No description provided."}
                        </p>
                        {isCommunity && deck.owner?.username && (
                            <Chip size="sm" variant="flat" className="mt-2 w-fit" startcontent={<Users size={12}/>}>
                                {deck.owner.username}
                            </Chip>
                        )}
                    </div>

                    <Chip
                        color={isCommunity ? "primary" : "secondary"}
                        size="sm"
                        variant="flat"
                        startcontent={isCommunity ? <Users size={12}/> : <Lock size={12}/>}
                    >
                        {isCommunity ? "Public" : deck.format || "Standard"}
                    </Chip>
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
                        {cardCount > 0 && (
                            <p className="text-xs text-zinc-500">
                                {cardCount} cards
                            </p>
                        )}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock size={14}/>
                            <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
                        </div>

                        {isCommunity ? (
                            <div className="flex gap-2">
                                <Tooltip content="View this deck">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        isIconOnly
                                        onPress={() => router.push(`/decks/${deck.id}`)}
                                    >
                                        <Eye size={16}/>
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Make your own copy">
                                    <Button
                                        size="sm"
                                        color="primary"
                                        isDisabled={isCopyingThis}
                                        onPress={() => handleCopyDeck(deck)}
                                        startcontent={isCopyingThis ? <Loader2 size={14} className="animate-spin"/> :
                                            <Copy size={14}/>}
                                    >
                                        {isCopyingThis ? "Copying..." : "Copy"}
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Tooltip content="Edit deck">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        isIconOnly
                                        onPress={() => router.push(`/decks/${deck.id}`)}
                                    >
                                        <Edit size={16}/>
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Delete deck">
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        isIconOnly
                                        isLoading={isDeletingThis}
                                        onPress={() => openDeleteModal(deck)}
                                    >
                                        <Trash2 size={16}/>
                                    </Button>
                                </Tooltip>
                                <Tooltip content={deck.isPublic ? "Make private" : "Share publicly"}>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color={deck.isPublic ? "success" : "default"}
                                        isLoading={isUpdatingVisibilityThis}
                                        onPress={() => handleToggleVisibility(deck)}
                                        startcontent={!isUpdatingVisibilityThis && (deck.isPublic ? <Globe size={14}/> :
                                            <Lock size={14}/>)}
                                    >
                                        {deck.isPublic ? "Public" : "Private"}
                                    </Button>
                                </Tooltip>
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
                            color="primary"
                            className="mt-6"
                            onPress={() => router.push("/decks/new")}
                            startcontent={<Plus size={16}/>}
                        >
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
                            color="primary"
                            onPress={() => router.push("/decks/new")}
                            startcontent={<Plus size={16}/>}
                        >
                            Create deck
                        </Button>
                        <Button
                            variant="ghost"
                            onPress={handleLogout}
                            startcontent={<LogOut size={16}/>}
                        >
                            Sign out
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {(error || deleteError) && (
                    <Alert
                        color="danger"
                        title="Error"
                        description={error || deleteError}
                        onClose={() => {
                            setError("");
                            setDeleteError("");
                        }}
                    />
                )}

                {/* Search and Sort */}
                <div className="flex flex-wrap gap-4 items-center">
                    <Input
                        placeholder="Search decks..."
                        value={searchTerm}
                        onChange={handleSearch}
                        startcontent={<Search size={16} className="text-zinc-400"/>}
                        className="flex-1 min-w-[200px] max-w-md"
                        size="sm"
                        isClearable
                        onClear={() => setSearchTerm("")}
                    />

                    <div className="flex gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startcontent={<Filter size={14}/>}
                                >
                                    Sort: {sortBy.replace("-", " ")}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Sort options"
                                selectionMode="single"
                                selectedKeys={new Set([sortBy])}
                                onSelectionChange={handleSortChange}
                            >
                                <DropdownItem key="newest" startcontent={<SortDesc size={14}/>}>
                                    Newest first
                                </DropdownItem>
                                <DropdownItem key="oldest" startcontent={<SortAsc size={14}/>}>
                                    Oldest first
                                </DropdownItem>
                                <DropdownItem key="name-asc" startcontent={<SortAsc size={14}/>}>
                                    Name (A-Z)
                                </DropdownItem>
                                <DropdownItem key="name-desc" startcontent={<SortDesc size={14}/>}>
                                    Name (Z-A)
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    aria-label="Deck categories"
                    selectedKey={activeTab}
                    onSelectionChange={handleTabChange}
                    color="primary"
                    variant="underlined"
                    size="lg"
                >
                    <Tab
                        key="my-decks"
                        title={
                            <div className="flex items-center gap-2">
                                <span>My Decks</span>
                                <Badge color="primary" size="sm">
                                    {decks.length}
                                </Badge>
                            </div>
                        }
                    />
                    <Tab
                        key="community"
                        title={
                            <div className="flex items-center gap-2">
                                <span>Community</span>
                                <Badge color="secondary" size="sm">
                                    {communityDecks.length}
                                </Badge>
                            </div>
                        }
                    />
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
                                        className="font-semibold text-white">"{deckToDelete.name}"</span>?
                                        All cards and data associated with this deck will be permanently removed.
                                    </p>
                                    {deleteError && (
                                        <Alert color="danger" title="Error" description={deleteError} className="mt-4"/>
                                    )}
                                </CardContent>
                                <div className="flex gap-3 px-6 pb-6 pt-2 justify-end">
                                    <Button variant="flat" onPress={closeDeleteModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="danger"
                                        isLoading={isDeleting === deckToDelete.id}
                                        onPress={handleDeleteDeck}
                                        startcontent={isDeleting !== deckToDelete.id && <Trash2 size={16}/>}
                                    >
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
                        {searchTerm && ` (filtered by "${searchTerm}")`}
                    </p>
                </div>
            </div>
        </div>
    );
}
