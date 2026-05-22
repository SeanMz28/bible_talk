import { internalMutation } from "./_generated/server";

const TALK_DESCRIPTION = `Kindness is beautiful… but it's also risky.

Some people appreciate it. Others take advantage. And it's easy to start putting up walls, fearing betrayal, and guarding your heart.

This Thursday we'll dig into how the Bible navigates that tension — how to stay kind without becoming naive, and how to trust God with the outcome. 🙏

📅 When: Thursday 6:30 PM
📍 Where: Rosebank Mall, The Zone @ Mochachos

Come share, listen, and grow with us. Everyone's welcome. 🌱`;

export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear all recaps.
    for (const r of await ctx.db.query("recaps").collect()) {
      await ctx.db.delete(r._id);
    }
    // Clear any existing posters so we don't double-archive.
    for (const p of await ctx.db.query("currentPoster").collect()) {
      await ctx.db.delete(p._id);
    }
    await ctx.db.insert("currentPoster", {
      title: "The Challenge of Being Kind",
      talkDate: "2026-05-21",
      startTime: "18:30",
      description: TALK_DESCRIPTION,
      posterUrl: "/challenge-of-being-kind.jpeg",
      updatedAt: Date.now(),
    });
  },
});
