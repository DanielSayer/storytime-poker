import type { EstimationCard } from "@storytime-poker/domain";
import { cn } from "@storytime-poker/ui/lib/utils";

import { CardDeck } from "./card-deck";

type RoomSidePanelProps = {
  cards: readonly EstimationCard[];
  selectedCard?: string;
  isFacilitator: boolean;
  isVoting: boolean;
  canReveal: boolean;
  onVote(card: string): void;
  onReveal(): void;
  onResetRound(): void;
  onMockAction(action: "skip" | "end"): void;
};

const MOCK_QUEUE = [
  ["PROJ-221", "Refund webhook retries"],
  ["PROJ-224", "Cart expiry job"],
  ["PROJ-230", "Pricing banner A/B"],
] as const;

const panelClass =
  "mt-4 w-[284px] shrink-0 self-start rounded-[20px_26px_18px_24px] border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_rgb(74_53_32_/_35%)] dark:shadow-[5px_5px_0_rgb(0_0_0_/_35%)]";
const adminButtonClass =
  "w-full cursor-pointer rounded-[14px_18px_12px_20px] border-0 px-4 py-3 font-bold text-sm transition duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_var(--foreground)] focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:outline-none focus-visible:shadow-[5px_5px_0_var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none";

export function RoomSidePanel({
  cards,
  selectedCard,
  isFacilitator,
  isVoting,
  canReveal,
  onVote,
  onReveal,
  onResetRound,
  onMockAction,
}: RoomSidePanelProps) {
  if (!isFacilitator) {
    return (
      <aside className={panelClass}>
        <CardDeck
          cards={cards}
          selectedCard={selectedCard}
          disabled={!isVoting}
          onSelect={onVote}
        />
      </aside>
    );
  }

  return (
    <aside className={panelClass}>
      <h2 className="m-0 font-bold text-sm uppercase tracking-[1.5px] opacity-70">
        Admin controls
      </h2>
      <div className="mt-3.5 flex flex-col gap-2.5">
        <button
          className={cn(
            adminButtonClass,
            "bg-primary text-primary-foreground shadow-[3px_3px_0_var(--foreground)]",
          )}
          disabled={!canReveal}
          type="button"
          onClick={onReveal}
        >
          Reveal cards
        </button>
        <button
          className={cn(
            adminButtonClass,
            "border-2 border-foreground bg-transparent text-foreground",
          )}
          type="button"
          onClick={onResetRound}
        >
          Reset round
        </button>
        <button
          className={cn(
            adminButtonClass,
            "border-2 border-foreground bg-transparent text-foreground",
          )}
          type="button"
          onClick={() => onMockAction("skip")}
        >
          Skip story
        </button>
        <button
          className={cn(adminButtonClass, "bg-destructive text-white")}
          type="button"
          onClick={() => onMockAction("end")}
        >
          End session
        </button>
      </div>

      <div className="mt-[18px] flex flex-col gap-2">
        <p className="m-0 font-bold text-[9px] uppercase tracking-[0.9px] opacity-60">
          Example queue · planned
        </p>
        {MOCK_QUEUE.map(([code, label], index) => (
          <div
            className="rounded-full border-2 border-foreground bg-background px-3 py-[7px] text-[11px] leading-[1.3]"
            key={code}
          >
            {index === 0 ? "Up next: " : null}
            <strong className="text-primary">{code}</strong> {label}
          </div>
        ))}
      </div>

      <CardDeck
        cards={cards}
        selectedCard={selectedCard}
        disabled={!isVoting}
        variant="compact"
        onSelect={onVote}
      />
    </aside>
  );
}
