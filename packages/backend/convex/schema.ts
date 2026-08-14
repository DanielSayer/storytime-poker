import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    deckId: v.optional(v.string()),
    facilitatorToken: v.string(),
    status: v.union(v.literal("voting"), v.literal("revealed")),
    roundNumber: v.number(),
    roundLabel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
  participants: defineTable({
    roomId: v.id("rooms"),
    token: v.string(),
    name: v.string(),
    isFacilitator: v.boolean(),
    vote: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_token", ["roomId", "token"]),
});
