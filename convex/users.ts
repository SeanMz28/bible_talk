import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { requireAdmin } from "./auth";

const ROLE = v.union(v.literal("admin"), v.literal("user"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const setRole = mutation({
  args: { id: v.id("users"), role: ROLE },
  handler: async (ctx, { id, role }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { role });
  },
});

/**
 * Mirrors any Better Auth users that don't yet have a row in `users`. Useful
 * if someone signed in before the trigger was wired up.
 *
 *     bunx --bun convex run users:backfill
 */
export const backfill = internalMutation({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let inserted = 0;
    while (true) {
      const page: {
        page: Array<Record<string, unknown>>;
        isDone: boolean;
        continueCursor: string | null;
      } = await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: "user",
        paginationOpts: { numItems: 100, cursor },
      });
      for (const u of page.page) {
        const id = (u._id ?? u.id) as string;
        const email = (u.email as string)?.toLowerCase();
        if (!id || !email) continue;
        const existing = await ctx.db
          .query("users")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", id))
          .first();
        if (existing) continue;
        await ctx.db.insert("users", {
          authUserId: id,
          email,
          name: (u.name as string | undefined) ?? undefined,
          role: "user",
          createdAt: Date.now(),
        });
        inserted += 1;
      }
      if (page.isDone || !page.continueCursor) break;
      cursor = page.continueCursor;
    }
    return { inserted };
  },
});

/**
 * Bootstrap helper for the very first admin (before any admin exists to call
 * `setRole`). No auth — meant to be run from the CLI:
 *
 *     bunx --bun convex run users:bootstrapAdmin '{"email":"you@example.com"}'
 *
 * The user must have signed in at least once so the trigger has created
 * their row.
 */
export const bootstrapAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    const row = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (!row) {
      throw new Error(
        `No user with email ${normalized} has signed in yet. Sign in via Google first, then re-run.`,
      );
    }
    await ctx.db.patch(row._id, { role: "admin" });
    return row._id;
  },
});
