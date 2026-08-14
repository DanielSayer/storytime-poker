import { getDeck } from "@storytime-poker/domain";
import { Button } from "@storytime-poker/ui/components/button";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";

import { CardDeck } from "./card-deck";
import { ParticipantsPanel } from "./participants-panel";
import { RevealedVotes } from "./revealed-votes";
import type { RoomView } from "./room-types";
import { RoundLabel } from "./round-label";

type PokerRoomProps = {
  room: RoomView;
  onVote(card: string): Promise<void>;
  onReveal(): Promise<void>;
  onNextRound(): Promise<void>;
  onSaveRoundLabel(label: string): Promise<void>;
};

function actionError(action: string) {
  return `${action} didn't work. Please try again.`;
}

export function PokerRoom({
  room,
  onVote,
  onReveal,
  onNextRound,
  onSaveRoundLabel,
}: PokerRoomProps) {
  const isVoting = room.status === "voting";
  const deck = getDeck(room.deckId);

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Room link copied");
    } catch {
      toast.error(
        "Copying didn't work. Copy the address from your browser instead.",
      );
    }
  }

  async function vote(card: string) {
    try {
      await onVote(card);
    } catch {
      toast.error(actionError("Your vote"));
    }
  }

  async function reveal() {
    try {
      await onReveal();
    } catch {
      toast.error(
        "At least one person needs to vote before the cards can be revealed.",
      );
    }
  }

  async function nextRound() {
    try {
      await onNextRound();
    } catch {
      toast.error(actionError("Starting a new round"));
    }
  }

  async function saveRoundLabel(label: string) {
    try {
      await onSaveRoundLabel(label);
      toast.success(label.trim() ? "Round label saved" : "Round label removed");
    } catch {
      toast.error(actionError("Saving the label"));
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Round {room.roundNumber}
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground text-xs">
              {isVoting ? "Voting open" : "Revealed"}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">Room {room.code}</p>
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
          <RoundLabel
            label={room.roundLabel}
            canEdit={room.isFacilitator && isVoting}
            onSave={saveRoundLabel}
          />
          {isVoting ? (
            <CardDeck
              cards={deck.cards}
              selectedCard={room.currentVote}
              onSelect={vote}
            />
          ) : (
            <RevealedVotes
              participants={room.participants}
              isFacilitator={room.isFacilitator}
              onNextRound={nextRound}
            />
          )}
        </section>
        <ParticipantsPanel
          participants={room.participants}
          isFacilitator={room.isFacilitator}
          isVoting={isVoting}
          onReveal={reveal}
        />
      </div>
    </main>
  );
}
