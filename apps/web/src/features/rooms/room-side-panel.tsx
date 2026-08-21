import {
  type EstimationCard,
  parseAzureDevOpsWorkItemUrl,
  ROOM_LIMITS,
} from "@storytime-poker/domain";
import { Input } from "@storytime-poker/ui/components/input";
import { cn } from "@storytime-poker/ui/lib/utils";
import { type FormEvent, useState } from "react";

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
  onSelectStory(url: string): Promise<boolean>;
  storyLinks: readonly string[];
  onMockAction(action: "skip" | "end"): void;
};

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
  onSelectStory,
  storyLinks,
  onMockAction,
}: RoomSidePanelProps) {
  const [storyUrl, setStoryUrl] = useState("");
  const [isSelectingStory, setIsSelectingStory] = useState(false);

  if (!isFacilitator) {
    return (
      <aside className={panelClass}>
        <CardDeck
          cards={cards}
          selectedCard={selectedCard}
          disabled={!isVoting}
          variant="rail"
          onSelect={onVote}
        />
      </aside>
    );
  }

  async function submitStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storyUrl.trim()) {
      return;
    }
    setIsSelectingStory(true);
    try {
      const selected = await onSelectStory(storyUrl);
      if (selected) {
        setStoryUrl("");
      }
    } finally {
      setIsSelectingStory(false);
    }
  }

  async function selectPreviousStory(url: string) {
    setIsSelectingStory(true);
    try {
      await onSelectStory(url);
    } finally {
      setIsSelectingStory(false);
    }
  }

  return (
    <aside className={panelClass}>
      <section aria-labelledby="story-link-heading">
        <h2
          className="m-0 font-bold text-sm uppercase tracking-[1.5px] opacity-70"
          id="story-link-heading"
        >
          Azure DevOps story
        </h2>
        <form className="mt-3 flex flex-col gap-2" onSubmit={submitStory}>
          <Input
            className="h-10 rounded-[12px_15px_11px_14px] border-2 border-foreground bg-background px-3 text-xs"
            disabled={isSelectingStory}
            maxLength={ROOM_LIMITS.storyUrlLength}
            placeholder="Paste work item link"
            type="url"
            value={storyUrl}
            onChange={(event) => setStoryUrl(event.target.value)}
          />
          <button
            className={cn(
              adminButtonClass,
              "bg-primary text-primary-foreground shadow-[3px_3px_0_var(--foreground)]",
            )}
            disabled={isSelectingStory || !storyUrl.trim()}
            type="submit"
          >
            {isSelectingStory ? "Selecting..." : "Select story"}
          </button>
        </form>
      </section>

      <section className="mt-[18px]" aria-labelledby="story-history-heading">
        <h3
          className="m-0 font-bold text-[9px] uppercase tracking-[0.9px] opacity-60"
          id="story-history-heading"
        >
          Story history
        </h3>
        {storyLinks.length === 0 ? (
          <p className="mt-2 text-[11px] leading-relaxed opacity-65">
            Previous links will appear here.
          </p>
        ) : (
          <ol className="mt-2 flex list-none flex-col gap-2 p-0">
            {storyLinks.map((url, index) => {
              const story = parseAzureDevOpsWorkItemUrl(url);
              return (
                <li key={url}>
                  <button
                    className={cn(
                      "w-full rounded-[12px_16px_11px_14px] border-2 border-foreground px-3 py-2 text-left text-[11px] leading-[1.3]",
                      index === 0
                        ? "cursor-default bg-primary/15"
                        : "cursor-pointer bg-background hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary/40",
                    )}
                    disabled={index === 0 || isSelectingStory}
                    title={url}
                    type="button"
                    onClick={() => void selectPreviousStory(url)}
                  >
                    <span className="block font-bold text-primary">
                      {story ? `#${story.id}` : "Work item"}
                    </span>
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap opacity-70">
                      {story?.organization ?? "Azure DevOps"}
                      {index === 0 ? " · current" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="my-[18px] border-foreground/25 border-t-2 border-dashed" />
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
