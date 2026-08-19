import { DEFAULT_DECK_ID, normalizeRoomCode } from "@storytime-poker/domain";
import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type RoomReader = QueryCtx | MutationCtx;

export async function findRoomByCode(ctx: RoomReader, code: string) {
  return await ctx.db
    .query("rooms")
    .withIndex("by_code", (query) => query.eq("code", normalizeRoomCode(code)))
    .unique();
}

export async function requireRoom(ctx: RoomReader, code: string) {
  const room = await findRoomByCode(ctx, code);
  if (!room) {
    throw new ConvexError("This room could not be found.");
  }
  return room;
}

export async function listParticipants(ctx: RoomReader, roomId: Id<"rooms">) {
  return await ctx.db
    .query("participants")
    .withIndex("by_room", (query) => query.eq("roomId", roomId))
    .collect();
}

export async function findParticipant(
  ctx: RoomReader,
  roomId: Id<"rooms">,
  participantToken: string,
) {
  return await ctx.db
    .query("participants")
    .withIndex("by_room_and_token", (query) =>
      query.eq("roomId", roomId).eq("token", participantToken),
    )
    .unique();
}

export async function requireParticipant(
  ctx: RoomReader,
  roomId: Id<"rooms">,
  participantToken: string,
) {
  const participant = await findParticipant(ctx, roomId, participantToken);
  if (!participant) {
    throw new ConvexError("Join the room before taking part.");
  }
  return participant;
}

export function requireFacilitator(
  room: Doc<"rooms">,
  facilitatorToken: string,
) {
  if (room.facilitatorToken !== facilitatorToken) {
    throw new ConvexError("Only the room facilitator can do that.");
  }
}

export function toRoomView(
  room: Doc<"rooms">,
  participants: Doc<"participants">[],
  participantToken?: string,
) {
  const currentParticipant = participantToken
    ? participants.find((participant) => participant.token === participantToken)
    : undefined;
  return {
    code: room.code,
    deckId: room.deckId ?? DEFAULT_DECK_ID,
    status: room.status,
    roundNumber: room.roundNumber,
    roundLabel: room.roundLabel,
    isJoined: Boolean(currentParticipant),
    isFacilitator: currentParticipant?.isFacilitator ?? false,
    currentVote: currentParticipant?.vote,
    participants: participants
      .sort((first, second) => first.joinedAt - second.joinedAt)
      .map((participant) => ({
        id: participant._id,
        name: participant.name,
        isFacilitator: participant.isFacilitator,
        hasVoted: Boolean(participant.vote),
        vote: room.status === "revealed" ? participant.vote : undefined,
      })),
  };
}
