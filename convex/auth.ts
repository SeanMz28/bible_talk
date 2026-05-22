import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components, internal } from "./_generated/api";
import { query, type QueryCtx, type MutationCtx } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// Explicit type annotation breaks a TS inference cycle: `authComponent` is
// re-exported through `api.d.ts`, so referencing `internal.userMirror.*` in
// its initializer makes TS chase its own tail when inferring this var's type.
//
// The component only invokes `authFunctions.onCreate` when a matching
// `triggers[model].onCreate` is also defined (adapter.ts:266). We don't use
// the triggers config — userMirror.ts owns the real logic — but we have to
// register no-op gates here for "user" so the component fires the mutations.
export const authComponent: ReturnType<typeof createClient<DataModel>> =
  createClient<DataModel>(components.betterAuth, {
    triggers: {
      user: {
        onCreate: async () => {},
        onUpdate: async () => {},
        onDelete: async () => {},
      },
    },
    authFunctions: {
      onCreate: internal.userMirror.onCreate,
      onUpdate: internal.userMirror.onUpdate,
      onDelete: internal.userMirror.onDelete,
    },
  });

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
    plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
  });

export const { getAuthUser } = authComponent.clientApi();

/**
 * Throws unless the current signed-in user has role="admin" in the `users`
 * table. New users land with role="user" via the trigger in userMirror.ts;
 * promote them by editing their row in the Convex dashboard or via
 * `users:setRole`.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) throw new Error("Not authenticated");
  const row = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
    .first();
  if (!row || row.role !== "admin") throw new Error("Not authorized");
  return { authUser, user: row };
}

export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return false;
    const row = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .first();
    return !!row && row.role === "admin";
  },
});
