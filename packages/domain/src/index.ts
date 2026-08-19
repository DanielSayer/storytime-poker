export const ROOM_LIMITS = {
  codeLength: 6,
  labelLength: 120,
  nameLength: 30,
  participants: 16,
  storyHistory: 50,
  storyUrlLength: 500,
} as const;

export const ROOM_ERROR_CODES = {
  full: "ROOM_FULL",
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

export type AzureDevOpsWorkItemReference = {
  id: number;
  organization: string;
  url: string;
};

function normalizedPathSegment(segment: string) {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return undefined;
  }
}

export function parseAzureDevOpsWorkItemUrl(
  value: string,
): AzureDevOpsWorkItemReference | undefined {
  if (value.length > ROOM_LIMITS.storyUrlLength) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") {
    return undefined;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const workItemsIndex = segments.findIndex(
    (segment) => segment.toLowerCase() === "_workitems",
  );
  if (
    workItemsIndex < 0 ||
    segments[workItemsIndex + 1]?.toLowerCase() !== "edit"
  ) {
    return undefined;
  }

  const idValue = segments[workItemsIndex + 2];
  if (!idValue || !/^\d+$/.test(idValue)) {
    return undefined;
  }
  const id = Number(idValue);
  if (!Number.isSafeInteger(id) || id < 1) {
    return undefined;
  }

  let organization: string | undefined;
  let projectSegments: string[] = [];
  if (url.hostname.toLowerCase() === "dev.azure.com") {
    organization = segments[0]?.toLowerCase();
    projectSegments = segments.slice(1, workItemsIndex);
  } else {
    const legacyHost = /^([a-z0-9][a-z0-9-]{0,49})\.visualstudio\.com$/i.exec(
      url.hostname,
    );
    organization = legacyHost?.[1]?.toLowerCase();
    projectSegments = segments.slice(0, workItemsIndex);
  }

  if (
    !organization ||
    !/^[a-z0-9][a-z0-9-]{0,49}$/.test(organization) ||
    projectSegments.length > 2
  ) {
    return undefined;
  }
  const normalizedProjectSegments = projectSegments.map(normalizedPathSegment);
  if (normalizedProjectSegments.some((segment) => !segment)) {
    return undefined;
  }

  const canonicalPath = [
    organization,
    ...normalizedProjectSegments,
    "_workitems",
    "edit",
    String(id),
  ].join("/");
  return {
    id,
    organization,
    url: `https://dev.azure.com/${canonicalPath}`,
  };
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
