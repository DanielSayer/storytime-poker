import {
  parseAzureDevOpsWorkItemUrl,
  ROOM_LIMITS,
} from "@storytime-poker/domain";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  listParticipants,
  requireFacilitator,
  requireParticipant,
  requireRoom,
} from "./roomModel";

function validStoryUrl(value: string) {
  const reference = parseAzureDevOpsWorkItemUrl(value);
  if (!reference) {
    throw new ConvexError("Paste a valid Azure DevOps work item link.");
  }
  return reference.url;
}

export const list = query({
  args: { code: v.string(), participantToken: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    await requireParticipant(ctx, room._id, args.participantToken);
    return room.storyLinks ?? [];
  },
});

export const select = mutation({
  args: {
    code: v.string(),
    facilitatorToken: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireFacilitator(room, args.facilitatorToken);
    const url = validStoryUrl(args.url);
    const currentUrl = room.storyLinks?.[0];
    if (currentUrl === url) {
      return;
    }

    const participants = await listParticipants(ctx, room._id);
    for (const participant of participants) {
      if (participant.vote !== undefined) {
        await ctx.db.patch(participant._id, { vote: undefined });
      }
    }

    const storyLinks = [
      url,
      ...(room.storyLinks ?? []).filter((storyUrl) => storyUrl !== url),
    ].slice(0, ROOM_LIMITS.storyHistory);
    await ctx.db.patch(room._id, {
      storyLinks,
      status: "voting",
      roundNumber: currentUrl ? room.roundNumber + 1 : room.roundNumber,
      roundLabel: undefined,
      updatedAt: Date.now(),
    });
  },
});
