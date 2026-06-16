import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  currentPoster: defineTable({
    title: v.union(v.string(), v.null()),
    talkDate: v.union(v.string(), v.null()),
    startTime: v.string(),
    description: v.union(v.string(), v.null()),
    posterUrl: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  }),
  recaps: defineTable({
    title: v.string(),
    talkDate: v.string(),
    startTime: v.optional(v.string()),
    posterUrl: v.union(v.string(), v.null()),
    content: v.string(),
  }).index("by_talkDate", ["talkDate"]),
  bookings: defineTable({
    name: v.string(),
    surname: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    occupation: v.union(
      v.literal("working"),
      v.literal("student"),
      v.literal("other"),
    ),
    phone: v.string(),
  }),
  // Mirror of Better Auth's user table with an extra `role` field.
  // Rows are created/updated/deleted via Better Auth triggers in auth.ts.
  // To promote someone, edit their `role` to "admin" in the Convex dashboard.
  users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),
});
