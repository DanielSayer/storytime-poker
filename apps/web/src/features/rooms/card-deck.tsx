import { cn } from "@storytime-poker/ui/lib/utils";

type CardDeckProps = {
  cards: readonly string[];
  selectedCard?: string;
  disabled?: boolean;
  variant?: "full" | "compact";
  onSelect(card: string): void;
};

export function CardDeck({
  cards,
  selectedCard,
  disabled = false,
  variant = "full",
  onSelect,
}: CardDeckProps) {
  const compact = variant === "compact";

  return (
    <section
      className={cn(
        "mt-0.5",
        compact &&
          "mt-5 border-foreground/30 border-t-2 border-dashed pt-[18px]",
      )}
    >
      <div>
        <h2 className="m-0 font-bold text-sm uppercase tracking-[1.5px] opacity-70">
          {compact ? "Your card" : "Choose your card"}
        </h2>
        <p
          className={cn(
            "mt-1.5 mb-0 text-[11px] leading-[1.35] opacity-70",
            compact && "hidden",
          )}
        >
          {disabled
            ? "Voting is locked for this round."
            : "Your vote stays hidden until the cards are revealed."}
        </p>
      </div>
      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-2.5",
          compact && "mt-2.5 grid-cols-5 gap-1.5",
        )}
      >
        {cards.map((card) => {
          const selected = selectedCard === card;
          return (
            <button
              className={cn(
                "aspect-[3/4] min-w-0 cursor-pointer rounded-[10px_14px_9px_12px] border-2 border-foreground bg-card font-extrabold text-[22px] text-foreground shadow-[3px_3px_0_rgb(74_53_32_/_25%)] transition duration-150 hover:-translate-y-[3px] hover:-rotate-1 hover:border-primary hover:shadow-[4px_5px_0_var(--foreground)] focus-visible:-translate-y-[3px] focus-visible:-rotate-1 focus-visible:border-primary focus-visible:shadow-[4px_5px_0_var(--foreground)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 dark:shadow-[3px_3px_0_rgb(0_0_0_/_30%)]",
                compact &&
                  "rounded-[6px_8px_5px_7px] border font-bold text-[13px] shadow-[2px_2px_0_rgb(74_53_32_/_25%)] dark:shadow-[2px_2px_0_rgb(0_0_0_/_30%)]",
                selected && "bg-primary text-primary-foreground",
              )}
              disabled={disabled}
              key={card}
              type="button"
              onClick={() => onSelect(card)}
              aria-pressed={selected}
            >
              {card}
            </button>
          );
        })}
      </div>
      <p
        className={cn(
          "mt-2.5 mb-0 text-[10px] opacity-60",
          compact && "hidden",
        )}
      >
        Choose ? when you need more context.
      </p>
    </section>
  );
}
