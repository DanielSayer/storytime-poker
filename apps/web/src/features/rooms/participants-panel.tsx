import { Button } from "@storytime-poker/ui/components/button";
import { Check, Crown, Eye } from "lucide-react";

import type { RoomParticipant } from "./room-types";

type ParticipantsPanelProps = {
  participants: RoomParticipant[];
  isFacilitator: boolean;
  isVoting: boolean;
  onReveal(): void;
};

export function ParticipantsPanel({
  participants,
  isFacilitator,
  isVoting,
  onReveal,
}: ParticipantsPanelProps) {
  const votedCount = participants.filter(
    (participant) => participant.hasVoted,
  ).length;
  return (
    <aside className="rounded-xl border bg-card p-4 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Participants</h2>
        <span className="text-muted-foreground text-sm">
          {votedCount}/{participants.length} voted
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {participants.map((participant) => (
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
      {isFacilitator && isVoting ? (
        <Button
          className="mt-5 h-10 w-full rounded-lg"
          disabled={votedCount === 0}
          onClick={onReveal}
        >
          <Eye /> Reveal cards
        </Button>
      ) : null}
      {!isFacilitator && !isVoting ? (
        <p className="mt-5 text-center text-muted-foreground text-sm">
          Waiting for the facilitator to start a fresh round.
        </p>
      ) : null}
    </aside>
  );
}
