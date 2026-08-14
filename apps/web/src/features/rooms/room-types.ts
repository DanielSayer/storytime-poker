import type { api } from "@storytime-poker/backend/convex/_generated/api";
import type { VoteSummary } from "@storytime-poker/domain";
import type { FunctionReturnType } from "convex/server";

export type RoomView = NonNullable<FunctionReturnType<typeof api.rooms.get>>;
export type RoomParticipant = RoomView["participants"][number];

export function formatVoteSummary(summary: VoteSummary) {
  if (!summary) {
    return undefined;
  }
  if (summary.kind === "consensus") {
    return summary.vote === "?"
      ? "Everyone needs more context"
      : `Consensus: ${summary.vote}`;
  }
  if (summary.kind === "needs-context") {
    return "More context needed";
  }
  const range = `Range: ${summary.low}-${summary.high}`;
  return summary.needsContext
    ? `${range} - Some voters need more context`
    : range;
}
