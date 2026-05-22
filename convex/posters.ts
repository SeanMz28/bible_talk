import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("currentPoster").order("desc").take(1);
    return docs[0] ?? null;
  },
});

export const update = mutation({
  args: {
    title: v.union(v.string(), v.null()),
    talkDate: v.union(v.string(), v.null()),
    startTime: v.string(),
    description: v.union(v.string(), v.null()),
    posterUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Recaps are created explicitly via the recap form, so saving a new
    // upcoming talk simply replaces the current one (no auto-archive).
    const existing = (await ctx.db.query("currentPoster").take(1))[0];
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("currentPoster", { ...args, updatedAt: Date.now() });
    }
  },
});
