import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("recaps")
      .withIndex("by_talkDate")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    talkDate: v.string(),
    posterUrl: v.union(v.string(), v.null()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.title.length < 1 || args.title.length > 200)
      throw new Error("Invalid title");
    if (args.content.length < 1 || args.content.length > 20000)
      throw new Error("Invalid content");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.talkDate))
      throw new Error("Invalid date");
    await ctx.db.insert("recaps", args);
  },
});

export const remove = mutation({
  args: { id: v.id("recaps") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
