import {
  DEFAULT_DECK_ID,
  isCardInDeck,
  isRoomCode,
  normalizeParticipantName,
  normalizeRoomCode,
  normalizeRoundLabel,
  ROOM_LIMITS,
} from "@storytime-poker/domain";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  findParticipant,
  findRoomByCode,
  listParticipants,
  requireFacilitator,
  requireParticipant,
  requireRoom,
  toRoomView,
} from "./roomModel";

const roomCodeValidator = v.string();

function validName(name: string) {
  const normalized = normalizeParticipantName(name);
  if (normalized.length < 1 || normalized.length > ROOM_LIMITS.nameLength) {
    throw new ConvexError(
      `Enter a name between 1 and ${ROOM_LIMITS.nameLength} characters.`,
    );
  }
  return normalized;
}

function validRoomCode(code: string) {
  if (!isRoomCode(code)) {
    throw new ConvexError("That room link is not valid.");
  }
  return normalizeRoomCode(code);
}

function validRoundLabel(label: string) {
  const normalized = normalizeRoundLabel(label);
  if (normalized.length > ROOM_LIMITS.labelLength) {
    throw new ConvexError(
      `Keep the round label under ${ROOM_LIMITS.labelLength} characters.`,
    );
  }
  return normalized || undefined;
}

export const create = mutation({
  args: {
    code: roomCodeValidator,
    name: v.string(),
    participantToken: v.string(),
    facilitatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const code = validRoomCode(args.code);
    if (await findRoomByCode(ctx, code)) {
      throw new ConvexError(
        "That room code is already in use. Please try again.",
      );
    }
    const now = Date.now();
    const roomId = await ctx.db.insert("rooms", {
      code,
      deckId: DEFAULT_DECK_ID,
      facilitatorToken: args.facilitatorToken,
      status: "voting",
      roundNumber: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("participants", {
      roomId,
      token: args.participantToken,
      name: validName(args.name),
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
    if (await findParticipant(ctx, room._id, args.participantToken)) {
      return;
    }
    const name = validName(args.name);
    const participants = await listParticipants(ctx, room._id);
    if (participants.length >= ROOM_LIMITS.participants) {
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
    if (!isRoomCode(args.code)) {
      return null;
    }
    const room = await findRoomByCode(ctx, args.code);
    if (!room) {
      return null;
    }
    return toRoomView(
      room,
      await listParticipants(ctx, room._id),
      args.participantToken,
    );
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
    if (!isCardInDeck(args.card, room.deckId)) {
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
    requireFacilitator(room, args.facilitatorToken);
    if (room.status !== "voting") {
      return;
    }
    const participants = await listParticipants(ctx, room._id);
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
    requireFacilitator(room, args.facilitatorToken);
    const participants = await listParticipants(ctx, room._id);
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
    requireFacilitator(room, args.facilitatorToken);
    if (room.status !== "voting") {
      throw new ConvexError(
        "The round label is locked after votes are revealed.",
      );
    }
    await ctx.db.patch(room._id, {
      roundLabel: validRoundLabel(args.label),
      updatedAt: Date.now(),
    });
  },
});
