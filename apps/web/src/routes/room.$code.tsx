import { api } from "@storytime-poker/backend/convex/_generated/api";
import { Button } from "@storytime-poker/ui/components/button";
import { Input } from "@storytime-poker/ui/components/input";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Clipboard,
  Crown,
  Eye,
  Loader2,
  RotateCcw,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/room/$code")({
  component: RoomComponent,
});

const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?"] as const;

type RoomIdentity = {
  participantToken: string;
  facilitatorToken?: string;
};

function identityKey(code: string) {
  return `storytime-poker:${code}`;
}

function readIdentity(code: string): RoomIdentity | undefined {
  try {
    const stored = localStorage.getItem(identityKey(code));
    return stored ? (JSON.parse(stored) as RoomIdentity) : undefined;
  } catch {
    return undefined;
  }
}

function friendlyActionError(action: string) {
  return `${action} didn’t work. Please try again.`;
}

function RoomComponent() {
  const { code: routeCode } = Route.useParams();
  const code = routeCode.toUpperCase();
  const [identity, setIdentity] = useState<RoomIdentity>();
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [name, setName] = useState("");
  const [joinError, setJoinError] = useState<string>();
  const [isJoining, setIsJoining] = useState(false);
  const [roundLabel, setRoundLabel] = useState("");
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  useEffect(() => {
    setIdentity(readIdentity(code));
    setIdentityLoaded(true);
  }, [code]);

  const room = useQuery(api.rooms.get, {
    code,
    participantToken: identity?.participantToken,
  });
  const joinRoom = useMutation(api.rooms.join);
  const submitVote = useMutation(api.rooms.vote);
  const revealVotes = useMutation(api.rooms.reveal);
  const startNextRound = useMutation(api.rooms.startNextRound);
  const updateRoundLabel = useMutation(api.rooms.updateRoundLabel);

  useEffect(() => {
    setRoundLabel(room?.roundLabel ?? "");
  }, [room?.roundLabel]);

  const voteSummary = useMemo(() => {
    if (room?.status !== "revealed") {
      return undefined;
    }
    const votes = room.participants.flatMap((participant) =>
      participant.vote ? [participant.vote] : [],
    );
    if (votes.length === 0) {
      return undefined;
    }
    if (votes.every((vote) => vote === votes[0])) {
      return votes[0] === "?"
        ? "Everyone needs more context"
        : `Consensus: ${votes[0]}`;
    }
    const numericVotes = votes
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (numericVotes.length === 0) {
      return "More context needed";
    }
    const range = `Range: ${numericVotes[0]}–${numericVotes.at(-1)}`;
    return votes.includes("?")
      ? `${range} · Some voters need more context`
      : range;
  }, [room]);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setJoinError("Enter your name to join the room.");
      return;
    }
    setJoinError(undefined);
    setIsJoining(true);
    const nextIdentity = { participantToken: crypto.randomUUID() };
    try {
      await joinRoom({
        code,
        name,
        participantToken: nextIdentity.participantToken,
      });
      localStorage.setItem(identityKey(code), JSON.stringify(nextIdentity));
      setIdentity(nextIdentity);
    } catch {
      setJoinError("You couldn’t join with that name. Try a different name.");
      setIsJoining(false);
    }
  }

  async function handleVote(card: string) {
    if (!identity) {
      return;
    }
    try {
      await submitVote({
        code,
        participantToken: identity.participantToken,
        card,
      });
    } catch {
      toast.error(friendlyActionError("Your vote"));
    }
  }

  async function handleReveal() {
    if (!identity?.facilitatorToken) {
      return;
    }
    try {
      await revealVotes({ code, facilitatorToken: identity.facilitatorToken });
    } catch {
      toast.error(
        "At least one person needs to vote before the cards can be revealed.",
      );
    }
  }

  async function handleNextRound() {
    if (!identity?.facilitatorToken) {
      return;
    }
    try {
      await startNextRound({
        code,
        facilitatorToken: identity.facilitatorToken,
      });
    } catch {
      toast.error(friendlyActionError("Starting a new round"));
    }
  }

  async function handleSaveLabel() {
    if (!identity?.facilitatorToken) {
      return;
    }
    setIsSavingLabel(true);
    try {
      await updateRoundLabel({
        code,
        facilitatorToken: identity.facilitatorToken,
        label: roundLabel,
      });
      toast.success(
        roundLabel.trim() ? "Round label saved" : "Round label removed",
      );
    } catch {
      toast.error(friendlyActionError("Saving the label"));
    } finally {
      setIsSavingLabel(false);
    }
  }

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Room link copied");
    } catch {
      toast.error(
        "Copying didn’t work. Copy the address from your browser instead.",
      );
    }
  }

  if (!identityLoaded || room === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading room"
        />
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="font-semibold text-3xl">Room not found</h1>
        <p className="mt-3 text-muted-foreground">
          This link may be incorrect or the room may no longer exist.
        </p>
        <Button className="mt-6 rounded-lg" render={<Link to="/" />}>
          Create a new room
        </Button>
      </main>
    );
  }

  if (!room.isJoined) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
        <section className="w-full rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="size-5" />
          </div>
          <p className="font-medium text-muted-foreground text-sm">
            Room {code}
          </p>
          <h1 className="mt-1 font-semibold text-2xl">Join the vote</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Enter the name your team will recognise.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleJoin}>
            <Input
              className="h-11 rounded-lg px-3 text-base md:text-base"
              maxLength={30}
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            {joinError ? (
              <p className="text-destructive text-sm">{joinError}</p>
            ) : null}
            <Button
              className="h-11 w-full rounded-lg text-sm"
              disabled={isJoining}
            >
              {isJoining ? "Joining…" : "Join room"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  const votedCount = room.participants.filter(
    (participant) => participant.hasVoted,
  ).length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Round {room.roundNumber}
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground text-xs">
              {room.status === "voting" ? "Voting open" : "Revealed"}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">Room {code}</p>
        </div>
        <Button
          className="h-10 rounded-lg"
          variant="outline"
          onClick={copyRoomLink}
        >
          <Clipboard /> Share room
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <section className="min-w-0">
          {room.isFacilitator && room.status === "voting" ? (
            <div className="mb-8 rounded-xl border bg-card p-4">
              <label className="font-medium text-sm" htmlFor="round-label">
                Optional round label
              </label>
              <div className="mt-2 flex gap-2">
                <Input
                  className="h-10 rounded-lg"
                  id="round-label"
                  maxLength={120}
                  placeholder="e.g. PROJ-123 — Export reports"
                  value={roundLabel}
                  onChange={(event) => setRoundLabel(event.target.value)}
                />
                <Button
                  className="h-10 rounded-lg"
                  variant="secondary"
                  disabled={isSavingLabel}
                  onClick={handleSaveLabel}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : room.roundLabel ? (
            <div className="mb-8 rounded-xl border bg-card p-4">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                This round
              </p>
              <p className="mt-1 font-medium">{room.roundLabel}</p>
            </div>
          ) : null}

          {room.status === "voting" ? (
            <>
              <div className="mb-5">
                <h2 className="font-semibold text-xl">Choose your card</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Your vote stays hidden until the facilitator reveals the
                  round.
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-3">
                {DECK.map((card) => {
                  const selected = room.currentVote === card;
                  return (
                    <button
                      className={`aspect-[3/4] rounded-xl border-2 font-semibold text-xl transition hover:-translate-y-1 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-card"}`}
                      key={card}
                      type="button"
                      onClick={() => handleVote(card)}
                      aria-pressed={selected}
                    >
                      {card}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-muted-foreground text-sm">
                Select ? when you need more context.
              </p>
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-xl">Cards revealed</h2>
                  {voteSummary ? (
                    <p className="mt-1 font-medium text-primary">
                      {voteSummary}
                    </p>
                  ) : null}
                </div>
                {room.isFacilitator ? (
                  <Button className="h-10 rounded-lg" onClick={handleNextRound}>
                    <RotateCcw /> Start fresh round
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {room.participants.map((participant) => (
                  <div
                    className="rounded-xl border bg-card p-4 text-center"
                    key={participant.id}
                  >
                    <div className="mx-auto flex aspect-[3/4] w-16 items-center justify-center rounded-lg bg-primary font-bold text-2xl text-primary-foreground">
                      {participant.vote ?? "—"}
                    </div>
                    <p className="mt-3 truncate font-medium">
                      {participant.name}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="rounded-xl border bg-card p-4 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Participants</h2>
            <span className="text-muted-foreground text-sm">
              {votedCount}/{room.participants.length} voted
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {room.participants.map((participant) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                key={participant.id}
              >
                <span className="flex min-w-0 items-center gap-2 truncate font-medium text-sm">
                  {participant.isFacilitator ? (
                    <Crown
                      className="size-4 shrink-0 text-amber-500"
                      aria-label="Facilitator"
                    />
                  ) : null}
                  <span className="truncate">{participant.name}</span>
                </span>
                {participant.hasVoted ? (
                  <Check
                    className="size-4 shrink-0 text-emerald-500"
                    aria-label="Voted"
                  />
                ) : (
                  <span className="size-2 shrink-0 rounded-full bg-muted-foreground/30" />
                )}
              </li>
            ))}
          </ul>
          {room.isFacilitator && room.status === "voting" ? (
            <Button
              className="mt-5 h-10 w-full rounded-lg"
              disabled={votedCount === 0}
              onClick={handleReveal}
            >
              <Eye /> Reveal cards
            </Button>
          ) : null}
          {!room.isFacilitator && room.status === "revealed" ? (
            <p className="mt-5 text-center text-muted-foreground text-sm">
              Waiting for the facilitator to start a fresh round.
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
