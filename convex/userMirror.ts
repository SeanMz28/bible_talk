import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

type AuthUserDoc = {
  _id: string;
  email: string;
  name?: string;
};

/** Fired by Better Auth after a user is created in the component's tables. */
export const onCreate = internalMutation({
  args: { doc: v.any(), model: v.string() },
  handler: async (ctx, { doc, model }) => {
    if (model !== "user") return;
    const user = doc as AuthUserDoc;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", user._id))
      .first();
    if (existing) return;
    await ctx.db.insert("users", {
      authUserId: user._id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: "user",
      createdAt: Date.now(),
    });
  },
});

export const onUpdate = internalMutation({
  args: { oldDoc: v.any(), newDoc: v.any(), model: v.string() },
  handler: async (ctx, { newDoc, model }) => {
    if (model !== "user") return;
    const user = newDoc as AuthUserDoc;
    const row = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", user._id))
      .first();
    if (!row) return;
    await ctx.db.patch(row._id, {
      email: user.email.toLowerCase(),
      name: user.name,
    });
  },
});

export const onDelete = internalMutation({
  args: { doc: v.any(), model: v.string() },
  handler: async (ctx, { doc, model }) => {
    if (model !== "user") return;
    const user = doc as AuthUserDoc;
    const row = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", user._id))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});
