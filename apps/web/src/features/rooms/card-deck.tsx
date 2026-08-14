type CardDeckProps = {
  cards: readonly string[];
  selectedCard?: string;
  onSelect(card: string): void;
};

export function CardDeck({ cards, selectedCard, onSelect }: CardDeckProps) {
  return (
    <>
      <div className="mb-5">
        <h2 className="font-semibold text-xl">Choose your card</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Your vote stays hidden until the facilitator reveals the round.
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-3">
        {cards.map((card) => {
          const selected = selectedCard === card;
          return (
            <button
              className={`aspect-[3/4] rounded-xl border-2 font-semibold text-xl transition hover:-translate-y-1 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-card"}`}
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
      <p className="mt-3 text-muted-foreground text-sm">
        Select ? when you need more context.
      </p>
    </>
  );
}
