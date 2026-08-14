import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?"] as const;
const roomCodeValidator = v.string();

function cleanName(name: string) {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (cleaned.length < 1 || cleaned.length > 30) {
    throw new ConvexError("Enter a name between 1 and 30 characters.");
  }
  return cleaned;
}

function cleanCode(code: string) {
  const cleaned = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) {
    throw new ConvexError("That room link is not valid.");
  }
  return cleaned;
}

function cleanLabel(label: string) {
  const cleaned = label.trim().replace(/\s+/g, " ");
  if (cleaned.length > 120) {
    throw new ConvexError("Keep the round label under 120 characters.");
  }
  return cleaned || undefined;
}

async function findRoom(ctx: QueryCtx | MutationCtx, code: string) {
  return await ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", cleanCode(code)))
    .unique();
}

async function requireRoom(ctx: MutationCtx, code: string) {
  const room = await findRoom(ctx, code);
  if (!room) {
    throw new ConvexError("This room could not be found.");
  }
  return room;
}

async function requireParticipant(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  token: string,
) {
  const participant = await ctx.db
    .query("participants")
    .withIndex("by_room_and_token", (q) =>
      q.eq("roomId", roomId).eq("token", token),
    )
    .unique();
  if (!participant) {
    throw new ConvexError("Join the room before taking part.");
  }
  return participant;
}

function requireFacilitator(facilitatorToken: string, suppliedToken: string) {
  if (facilitatorToken !== suppliedToken) {
    throw new ConvexError("Only the room facilitator can do that.");
  }
}

export const create = mutation({
  args: {
    code: roomCodeValidator,
    name: v.string(),
    participantToken: v.string(),
    facilitatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const code = cleanCode(args.code);
    if (await findRoom(ctx, code)) {
      throw new ConvexError(
        "That room code is already in use. Please try again.",
      );
    }
    const now = Date.now();
    const roomId = await ctx.db.insert("rooms", {
      code,
      facilitatorToken: args.facilitatorToken,
      status: "voting",
      roundNumber: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("participants", {
      roomId,
      token: args.participantToken,
      name: cleanName(args.name),
      isFacilitator: true,
      joinedAt: now,
    });
    return { code };
  },
});

export const join = mutation({
  args: {
    code: roomCodeValidator,
    name: v.string(),
    participantToken: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_room_and_token", (q) =>
        q.eq("roomId", room._id).eq("token", args.participantToken),
      )
      .unique();
    if (existing) {
      return;
    }
    const name = cleanName(args.name);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    if (participants.length >= 30) {
      throw new ConvexError("This room is full.");
    }
    if (
      participants.some(
        (participant) => participant.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new ConvexError("That name is already being used in this room.");
    }
    await ctx.db.insert("participants", {
      roomId: room._id,
      token: args.participantToken,
      name,
      isFacilitator: false,
      joinedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { code: roomCodeValidator, participantToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!/^[A-Z0-9]{6}$/.test(args.code.trim().toUpperCase())) {
      return null;
    }
    const room = await findRoom(ctx, args.code);
    if (!room) {
      return null;
    }
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    const currentParticipant = args.participantToken
      ? participants.find(
          (participant) => participant.token === args.participantToken,
        )
      : undefined;
    return {
      code: room.code,
      status: room.status,
      roundNumber: room.roundNumber,
      roundLabel: room.roundLabel,
      isJoined: Boolean(currentParticipant),
      isFacilitator: currentParticipant?.isFacilitator ?? false,
      currentVote: currentParticipant?.vote,
      participants: participants
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((participant) => ({
          id: participant._id,
          name: participant.name,
          isFacilitator: participant.isFacilitator,
          hasVoted: Boolean(participant.vote),
          vote: room.status === "revealed" ? participant.vote : undefined,
        })),
    };
  },
});

export const vote = mutation({
  args: {
    code: roomCodeValidator,
    participantToken: v.string(),
    card: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    if (room.status !== "voting") {
      throw new ConvexError("Voting is locked until the next round.");
    }
    if (!(DECK as readonly string[]).includes(args.card)) {
      throw new ConvexError("That card is not part of this deck.");
    }
    const participant = await requireParticipant(
      ctx,
      room._id,
      args.participantToken,
    );
    await ctx.db.patch(participant._id, { vote: args.card });
  },
});

export const reveal = mutation({
  args: { code: roomCodeValidator, facilitatorToken: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireFacilitator(room.facilitatorToken, args.facilitatorToken);
    if (room.status !== "voting") {
      return;
    }
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    if (!participants.some((participant) => participant.vote)) {
      throw new ConvexError("Wait for at least one vote before revealing.");
    }
    await ctx.db.patch(room._id, { status: "revealed", updatedAt: Date.now() });
  },
});

export const startNextRound = mutation({
  args: { code: roomCodeValidator, facilitatorToken: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireFacilitator(room.facilitatorToken, args.facilitatorToken);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    for (const participant of participants) {
      await ctx.db.patch(participant._id, { vote: undefined });
    }
    await ctx.db.patch(room._id, {
      status: "voting",
      roundNumber: room.roundNumber + 1,
      roundLabel: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const updateRoundLabel = mutation({
  args: {
    code: roomCodeValidator,
    facilitatorToken: v.string(),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireFacilitator(room.facilitatorToken, args.facilitatorToken);
    if (room.status !== "voting") {
      throw new ConvexError(
        "The round label is locked after votes are revealed.",
      );
    }
    await ctx.db.patch(room._id, {
      roundLabel: cleanLabel(args.label),
      updatedAt: Date.now(),
    });
  },
});
