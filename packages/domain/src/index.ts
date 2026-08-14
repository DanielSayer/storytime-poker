export const ROOM_LIMITS = {
  codeLength: 6,
  labelLength: 120,
  nameLength: 30,
  participants: 30,
} as const;

export const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const ESTIMATION_DECKS = {
  fibonacci: {
    id: "fibonacci",
    label: "Fibonacci",
    cards: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?"],
  },
} as const;

export type DeckId = keyof typeof ESTIMATION_DECKS;
export type EstimationCard = (typeof ESTIMATION_DECKS)[DeckId]["cards"][number];

export const DEFAULT_DECK_ID: DeckId = "fibonacci";

export type VoteSummary =
  | { kind: "consensus"; vote: string }
  | { kind: "range"; low: number; high: number; needsContext: boolean }
  | { kind: "needs-context" }
  | undefined;

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export function isRoomCode(code: string) {
  return new RegExp(`^[A-Z0-9]{${ROOM_LIMITS.codeLength}}$`).test(
    normalizeRoomCode(code),
  );
}

export function normalizeParticipantName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeRoundLabel(label: string) {
  return label.trim().replace(/\s+/g, " ");
}

export function isDeckId(deckId: string): deckId is DeckId {
  return deckId in ESTIMATION_DECKS;
}

export function getDeck(deckId: string | undefined = DEFAULT_DECK_ID) {
  return ESTIMATION_DECKS[isDeckId(deckId) ? deckId : DEFAULT_DECK_ID];
}

export function isCardInDeck(card: string, deckId?: string) {
  return (getDeck(deckId).cards as readonly string[]).includes(card);
}

export function summarizeVotes(votes: readonly string[]): VoteSummary {
  if (votes.length === 0) {
    return undefined;
  }
  const firstVote = votes[0];
  if (firstVote !== undefined && votes.every((vote) => vote === firstVote)) {
    return { kind: "consensus", vote: firstVote };
  }
  const numericVotes = votes
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const low = numericVotes[0];
  if (low === undefined) {
    return { kind: "needs-context" };
  }
  return {
    kind: "range",
    low,
    high: numericVotes[numericVotes.length - 1] ?? low,
    needsContext: votes.includes("?"),
  };
}
