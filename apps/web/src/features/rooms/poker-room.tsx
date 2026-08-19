import { getDeck, summarizeVotes } from "@storytime-poker/domain";
import { toast } from "sonner";

import { PokerTable } from "./poker-table";
import { RoomSidePanel } from "./room-side-panel";
import type { RoomView } from "./room-types";
import { formatVoteSummary } from "./room-types";

type PokerRoomProps = {
  room: RoomView;
  onVote(card: string): Promise<void>;
  onReveal(): Promise<void>;
  onNextRound(): Promise<void>;
  onSaveRoundLabel(label: string): Promise<void>;
};

const statusCellClass =
  "min-w-0 border-foreground border-r-2 bg-transparent px-[18px] py-2.5 text-left last:border-r-0";
const statusLabelClass =
  "block text-[10px] uppercase tracking-[1.1px] opacity-60";
const statusValueClass =
  "mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[19px]";

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
  const votedCount = room.participants.filter(
    (participant) => participant.hasVoted,
  ).length;
  const revealedVotes = room.participants.flatMap((participant) =>
    participant.vote ? [participant.vote] : [],
  );
  const summary = isVoting
    ? undefined
    : formatVoteSummary(summarizeVotes(revealedVotes));

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

  async function resetRound() {
    try {
      await onNextRound();
      toast.success("A fresh round is ready");
    } catch {
      toast.error(actionError("Resetting the round"));
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

  function showMockedAction(action: "skip" | "end") {
    toast.info(
      action === "skip"
        ? "Story queues are not connected yet."
        : "Ending a session is not connected yet.",
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-x-auto bg-background font-[Trebuchet_MS,Comic_Sans_MS,cursive] text-foreground">
      <section
        className="mx-auto my-4.5 grid w-[calc(100vw-2rem)] min-w-260 max-w-295 grid-cols-[1.25fr_repeat(4,1fr)] overflow-hidden rounded-[20px_26px_18px_24px] border-2 border-foreground bg-card shadow-[5px_5px_0_rgb(74_53_32/35%)] dark:shadow-[5px_5px_0_rgb(0_0_0/35%)]"
        aria-label="Session status"
      >
        <button
          className={`${statusCellClass} cursor-pointer font-[inherit] text-foreground hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-3 focus-visible:outline-primary/35 focus-visible:-outline-offset-3`}
          title="Copy room link"
          type="button"
          onClick={copyRoomLink}
        >
          <span className={statusLabelClass}>Session</span>
          <strong className={statusValueClass}>{room.code}</strong>
        </button>
        <div className={statusCellClass}>
          <span className={statusLabelClass}>Round</span>
          <strong className={statusValueClass}>{room.roundNumber}</strong>
        </div>
        <div className={statusCellClass}>
          <span className={statusLabelClass}>Votes in</span>
          <strong className={statusValueClass}>
            <em className="text-primary not-italic">{votedCount}</em> /{" "}
            {room.participants.length}
          </strong>
        </div>
        <div className={statusCellClass}>
          <span className={statusLabelClass}>Timer</span>
          <strong className={statusValueClass} title="Timer not available">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Not available</span>
          </strong>
        </div>
        <div className={statusCellClass}>
          <span className={statusLabelClass}>Deck</span>
          <strong className={statusValueClass}>{deck.label}</strong>
        </div>
      </section>

      <div className="mx-auto mb-6 flex w-[calc(100vw-2rem)] min-w-260 max-w-295 items-start gap-6">
        <PokerTable
          participants={room.participants}
          isVoting={isVoting}
          roundLabel={room.roundLabel}
          canEditRoundLabel={room.isFacilitator && isVoting}
          summary={summary}
          onSaveRoundLabel={saveRoundLabel}
        />
        <RoomSidePanel
          cards={deck.cards}
          selectedCard={room.currentVote}
          isFacilitator={room.isFacilitator}
          isVoting={isVoting}
          canReveal={isVoting && votedCount > 0}
          onVote={vote}
          onReveal={reveal}
          onResetRound={resetRound}
          onMockAction={showMockedAction}
        />
      </div>
    </main>
  );
}
