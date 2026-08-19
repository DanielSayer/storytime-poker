import { cn } from "@storytime-poker/ui/lib/utils";
import type { CSSProperties } from "react";

import type { RoomParticipant } from "./room-types";
import { RoundLabel } from "./round-label";

const STAGE_WIDTH = 760;
const BASE_STAGE_HEIGHT = 700;

const seatCardClass =
  "mx-auto grid place-items-center border-2 border-foreground font-extrabold shadow-[3px_3px_0_rgb(74_53_32_/_40%)] [transform:rotate(var(--seat-tilt))] dark:shadow-[3px_3px_0_rgb(0_0_0_/_40%)]";
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

type SeatDensity = "regular" | "compact" | "tiny";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return initials.toUpperCase() || "?";
}

function getStageHeight(participantCount: number) {
  if (participantCount <= 16) {
    return BASE_STAGE_HEIGHT;
  }
  const horizontalSeats = Math.min(5, Math.ceil(participantCount / 4));
  const sideSeats = Math.ceil((participantCount - horizontalSeats * 2) / 2);
  return Math.max(BASE_STAGE_HEIGHT, 360 + (sideSeats - 1) * 170);
}

function getSeatDensity(participantCount: number): SeatDensity {
  if (participantCount <= 8) {
    return "regular";
  }
  if (participantCount <= 12) {
    return "compact";
  }
  if (participantCount <= 16) {
    return "tiny";
  }
  return "compact";
}

function getSeatPosition(
  index: number,
  participantCount: number,
  stageHeight: number,
): SeatPosition {
  if (participantCount <= 16) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / participantCount;
    const isDense = participantCount > 8;
    return {
      left: STAGE_WIDTH / 2 + Math.cos(angle) * (isDense ? 332 : 316),
      top: stageHeight / 2 + Math.sin(angle) * (isDense ? 286 : 265),
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
  const seatDensity = getSeatDensity(participants.length);
  const isRegularSeat = seatDensity === "regular";
  const isTinySeat = seatDensity === "tiny";
  const usesDenseOrbit = participants.length > 8 && participants.length <= 16;
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
        <div
          className={cn(
            "absolute z-0 grid place-items-center rounded-[50%] border-[10px] border-wood bg-[radial-gradient(circle,var(--felt-light)_0%,var(--felt)_70%)] shadow-[8px_8px_0_rgb(74_53_32_/_30%)] ring-[6px] ring-white/15 ring-inset dark:shadow-[8px_8px_0_rgb(0_0_0_/_35%)]",
            usesDenseOrbit
              ? "inset-x-[102px] inset-y-[155px]"
              : "inset-x-28 inset-y-[145px]",
          )}
          data-poker-table
        >
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
                className={cn(
                  "pointer-events-auto absolute top-[var(--seat-top)] left-[var(--seat-left)] -translate-x-1/2 -translate-y-1/2 text-center",
                  isRegularSeat
                    ? "w-[132px]"
                    : isTinySeat
                      ? "w-[70px]"
                      : "w-[82px]",
                )}
                data-poker-seat
                data-seat-density={seatDensity}
                key={participant.id}
                style={style}
              >
                <div
                  className={cn(
                    "relative mx-auto grid place-items-center rounded-[46%_54%_52%_48%] border-foreground bg-[#ffd9a0] font-bold text-[#4a3520] dark:bg-[#b9824d] dark:text-card-foreground",
                    isRegularSeat
                      ? "size-14 border-[3px] text-lg shadow-[3px_3px_0_rgb(74_53_32_/_35%)] dark:shadow-[3px_3px_0_rgb(0_0_0_/_35%)]"
                      : isTinySeat
                        ? "size-9 border-2 text-xs shadow-[2px_2px_0_rgb(74_53_32_/_35%)]"
                        : "size-11 border-2 text-sm shadow-[2px_2px_0_rgb(74_53_32_/_35%)]",
                  )}
                >
                  {getInitials(participant.name)}
                  <span
                    className={cn(
                      "absolute rounded-full border-background bg-muted-foreground",
                      isRegularSeat
                        ? "-right-0.5 -bottom-0.5 size-3.5 border-2"
                        : "-right-px -bottom-px size-2.5 border",
                    )}
                    title="Presence tracking is planned"
                  />
                </div>
                <p
                  className={cn(
                    "overflow-hidden text-ellipsis whitespace-nowrap font-bold",
                    isRegularSeat
                      ? "mt-2 text-[13px]"
                      : isTinySeat
                        ? "mt-0.5 text-[9px]"
                        : "mt-1 text-[11px]",
                  )}
                  title={participant.name}
                >
                  {participant.name}
                </p>
                {isRegularSeat || participant.isFacilitator ? (
                  <p
                    className={cn(
                      "m-0 uppercase opacity-60",
                      isRegularSeat
                        ? "text-[9px] tracking-[1px]"
                        : "text-[7px] tracking-[0.7px]",
                    )}
                  >
                    {participant.isFacilitator ? "Facilitator" : "Participant"}
                  </p>
                ) : null}
                {participant.hasVoted ? (
                  <div
                    className={cn(
                      seatCardClass,
                      isRegularSeat
                        ? "mt-2 h-[62px] w-11 rounded-[7px] text-lg"
                        : isTinySeat
                          ? "mt-1 h-7 w-5 rounded-[5px] text-[8px]"
                          : "mt-1.5 h-9 w-7 rounded-[5px] text-[10px]",
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
                    className={cn(
                      "mx-auto border-2 border-foreground/25 border-dashed bg-card/20",
                      isRegularSeat
                        ? "mt-2 h-[62px] w-11 rounded-[7px]"
                        : isTinySeat
                          ? "mt-1 h-7 w-5 rounded-[5px]"
                          : "mt-1.5 h-9 w-7 rounded-[5px]",
                    )}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    isRegularSeat
                      ? "mt-1.5 inline-block rounded-full bg-foreground px-[9px] py-[3px] font-bold text-[9px] text-background uppercase tracking-[0.5px]"
                      : "sr-only",
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
