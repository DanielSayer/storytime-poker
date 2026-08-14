import { summarizeVotes } from "@storytime-poker/domain";
import { Button } from "@storytime-poker/ui/components/button";
import { RotateCcw } from "lucide-react";

import type { RoomParticipant } from "./room-types";
import { formatVoteSummary } from "./room-types";

type RevealedVotesProps = {
  participants: RoomParticipant[];
  isFacilitator: boolean;
  onNextRound(): void;
};

export function RevealedVotes({
  participants,
  isFacilitator,
  onNextRound,
}: RevealedVotesProps) {
  const votes = participants.flatMap((participant) =>
    participant.vote ? [participant.vote] : [],
  );
  const summary = formatVoteSummary(summarizeVotes(votes));
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl">Cards revealed</h2>
          {summary ? (
            <p className="mt-1 font-medium text-primary">{summary}</p>
          ) : null}
        </div>
        {isFacilitator ? (
          <Button className="h-10 rounded-lg" onClick={onNextRound}>
            <RotateCcw /> Start fresh round
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {participants.map((participant) => (
          <div
            className="rounded-xl border bg-card p-4 text-center"
            key={participant.id}
          >
            <div className="mx-auto flex aspect-[3/4] w-16 items-center justify-center rounded-lg bg-primary font-bold text-2xl text-primary-foreground">
              {participant.vote ?? "-"}
            </div>
            <p className="mt-3 truncate font-medium">{participant.name}</p>
          </div>
        ))}
      </div>
    </>
  );
}
