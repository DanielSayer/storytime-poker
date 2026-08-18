import { cn } from "@storytime-poker/ui/lib/utils";
import type { CSSProperties } from "react";

import type { RoomParticipant } from "./room-types";
import { RoundLabel } from "./round-label";

const STAGE_WIDTH = 760;
const BASE_STAGE_HEIGHT = 700;

const seatCardClass =
  "mx-auto mt-2 grid h-[62px] w-11 place-items-center rounded-[7px] border-2 border-foreground font-extrabold text-lg shadow-[3px_3px_0_rgb(74_53_32_/_40%)] [transform:rotate(var(--seat-tilt))] dark:shadow-[3px_3px_0_rgb(0_0_0_/_40%)]";
const deckPatternClass =
  "bg-[repeating-linear-gradient(45deg,var(--primary)_0_8px,var(--deck-stripe)_8px_16px)] text-primary-foreground";

type PokerTableProps = {
  participants: RoomParticipant[];
  isVoting: boolean;
  roundLabel?: string;
  canEditRoundLabel: boolean;
  summary?: string;
  onSaveRoundLabel(label: string): Promise<void>;
};

type SeatPosition = {
  left: number;
  top: number;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return initials.toUpperCase() || "?";
}

function getStageHeight(participantCount: number) {
  if (participantCount <= 10) {
    return BASE_STAGE_HEIGHT;
  }
  const horizontalSeats = Math.min(5, Math.ceil(participantCount / 4));
  const sideSeats = Math.ceil((participantCount - horizontalSeats * 2) / 2);
  return Math.max(BASE_STAGE_HEIGHT, 360 + (sideSeats - 1) * 170);
}

function getSeatPosition(
  index: number,
  participantCount: number,
  stageHeight: number,
): SeatPosition {
  if (participantCount <= 10) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / participantCount;
    return {
      left: STAGE_WIDTH / 2 + Math.cos(angle) * 316,
      top: stageHeight / 2 + Math.sin(angle) * 265,
    };
  }

  const topCount = Math.min(5, Math.ceil(participantCount / 4));
  const bottomCount = topCount;
  const remaining = participantCount - topCount - bottomCount;
  const rightCount = Math.ceil(remaining / 2);
  const leftCount = remaining - rightCount;

  if (index < topCount) {
    return {
      left: ((index + 1) * STAGE_WIDTH) / (topCount + 1),
      top: 82,
    };
  }

  if (index < topCount + rightCount) {
    const sideIndex = index - topCount;
    return {
      left: STAGE_WIDTH - 72,
      top: 180 + sideIndex * 170,
    };
  }

  if (index < topCount + rightCount + bottomCount) {
    const bottomIndex = index - topCount - rightCount;
    return {
      left: STAGE_WIDTH - ((bottomIndex + 1) * STAGE_WIDTH) / (bottomCount + 1),
      top: stageHeight - 82,
    };
  }

  const sideIndex = index - topCount - rightCount - bottomCount;
  return {
    left: 72,
    top:
      leftCount === 1
        ? stageHeight / 2
        : 180 + sideIndex * ((stageHeight - 360) / (leftCount - 1)),
  };
}

export function PokerTable({
  participants,
  isVoting,
  roundLabel,
  canEditRoundLabel,
  summary,
  onSaveRoundLabel,
}: PokerTableProps) {
  const stageHeight = getStageHeight(participants.length);
  const stageStyle = {
    "--stage-height": `${stageHeight}px`,
  } as CSSProperties;

  return (
    <section
      className="grid min-w-0 flex-1 place-items-start py-4"
      aria-label="Poker table"
    >
      <div
        className="relative h-[var(--stage-height)] w-[760px] shrink-0"
        style={stageStyle}
      >
        <div className="absolute inset-x-28 inset-y-[145px] z-0 grid place-items-center rounded-[50%] border-[10px] border-wood bg-[radial-gradient(circle,var(--felt-light)_0%,var(--felt)_70%)] shadow-[8px_8px_0_rgb(74_53_32_/_30%)] ring-[6px] ring-white/15 ring-inset dark:shadow-[8px_8px_0_rgb(0_0_0_/_35%)]">
          <div className="w-[min(320px,70%)] text-center">
            <RoundLabel
              label={roundLabel}
              canEdit={canEditRoundLabel}
              onSave={onSaveRoundLabel}
            />
            <div
              className={cn(
                "mx-auto mt-3.5 grid h-[88px] w-16 place-items-center rounded-lg border-2 border-foreground text-[26px] shadow-[3px_3px_0_rgb(74_53_32_/_40%)] dark:shadow-[3px_3px_0_rgb(0_0_0_/_40%)]",
                deckPatternClass,
              )}
              aria-hidden="true"
            >
              ?
            </div>
            {summary ? (
              <p className="mt-3 inline-block rounded-full bg-card/85 px-2.5 py-1 font-bold text-[11px]">
                {summary}
              </p>
            ) : null}
          </div>
        </div>

        <ul className="pointer-events-none absolute inset-0 z-10 m-0 list-none p-0">
          {participants.map((participant, index) => {
            const position = getSeatPosition(
              index,
              participants.length,
              stageHeight,
            );
            const style = {
              "--seat-left": `${position.left}px`,
              "--seat-top": `${position.top}px`,
              "--seat-tilt": `${index % 2 === 0 ? -4 : 5}deg`,
            } as CSSProperties;
            return (
              <li
                className="pointer-events-auto absolute top-[var(--seat-top)] left-[var(--seat-left)] w-[132px] -translate-x-1/2 -translate-y-1/2 text-center"
                key={participant.id}
                style={style}
              >
                <div className="relative mx-auto grid size-14 place-items-center rounded-[46%_54%_52%_48%] border-[3px] border-foreground bg-[#ffd9a0] font-bold text-[#4a3520] text-lg shadow-[3px_3px_0_rgb(74_53_32_/_35%)] dark:bg-[#b9824d] dark:text-card-foreground dark:shadow-[3px_3px_0_rgb(0_0_0_/_35%)]">
                  {getInitials(participant.name)}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-background bg-muted-foreground"
                    title="Presence tracking is planned"
                  />
                </div>
                <p
                  className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[13px]"
                  title={participant.name}
                >
                  {participant.name}
                </p>
                <p className="m-0 text-[9px] uppercase tracking-[1px] opacity-60">
                  {participant.isFacilitator ? "Facilitator" : "Participant"}
                </p>
                {participant.hasVoted ? (
                  <div
                    className={cn(
                      seatCardClass,
                      isVoting ? deckPatternClass : "bg-card text-primary",
                    )}
                    aria-label={
                      isVoting ? "Vote submitted" : `Vote: ${participant.vote}`
                    }
                    role="img"
                  >
                    {isVoting ? "?" : participant.vote || "–"}
                  </div>
                ) : (
                  <div
                    className="mx-auto mt-2 h-[62px] w-11 rounded-[7px] border-2 border-foreground/25 border-dashed bg-card/20"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "mt-1.5 inline-block rounded-full bg-foreground px-[9px] py-[3px] font-bold text-[9px] text-background uppercase tracking-[0.5px]",
                    !participant.hasVoted && "opacity-50",
                  )}
                >
                  {participant.hasVoted ? "Voted" : "Thinking…"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
