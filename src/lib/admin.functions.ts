import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Could not verify admin access.");
  if (!data) throw new Error("Forbidden: admin access required.");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

const recapSchema = z.object({
  title: z.string().trim().min(1).max(200),
  talk_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  poster_url: z.string().url().max(1000).nullable().optional(),
  content: z.string().trim().min(1).max(20000),
});

export const createRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => recapSchema.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("recaps").insert({
      title: data.title,
      talk_date: data.talk_date,
      poster_url: data.poster_url ?? null,
      content: data.content,
    });
    if (error) {
      console.error(error);
      return { success: false, error: "Could not save recap." };
    }
    return { success: true };
  });

export const deleteRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("recaps").delete().eq("id", data.id);
    if (error) return { success: false, error: "Could not delete." };
    return { success: true };
  });

const posterSchema = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  talk_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  poster_url: z.string().url().max(1000).nullable().optional(),
  description: z.string().trim().max(20000).nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
});

export const updateCurrentPoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => posterSchema.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: existing } = await supabaseAdmin
      .from("current_poster")
      .select("id, title, talk_date, poster_url, description, start_time")
      .limit(1)
      .maybeSingle();
    const payload = {
      title: data.title ?? null,
      talk_date: data.talk_date ?? null,
      poster_url: data.poster_url ?? null,
      description: data.description ?? null,
      start_time: data.start_time ?? "18:30",
    };
    if (existing) {
      // Archive the previous upcoming talk into recaps (if it had content).
      if (existing.title && existing.talk_date) {
        const { error: archiveErr } = await supabaseAdmin.from("recaps").insert({
          title: existing.title,
          talk_date: existing.talk_date,
          start_time: existing.start_time ?? null,
          poster_url: existing.poster_url ?? null,
          content: existing.description ?? "",
        });
        if (archiveErr) console.error("Failed to archive previous poster:", archiveErr);
      }
      const { error } = await supabaseAdmin
        .from("current_poster")
        .update(payload)
        .eq("id", existing.id);
      if (error) return { success: false, error: "Could not update poster." };
    } else {
      const { error } = await supabaseAdmin.from("current_poster").insert(payload);
      if (error) return { success: false, error: "Could not save poster." };
    }
    return { success: true };
  });

const uploadSchema = z.object({
  filename: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.string().min(1).max(100),
  base64: z.string().min(1),
  folder: z.enum(["recaps", "current"]),
});

export const uploadPosterImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => uploadSchema.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const buffer = Buffer.from(data.base64, "base64");
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return { success: false as const, error: "File too large (max 8MB)." };
    }
    const path = `${data.folder}/${Date.now()}-${data.filename}`;
    const { error } = await supabaseAdmin.storage
      .from("bible-talk-assets")
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (error) {
      console.error(error);
      return { success: false as const, error: "Upload failed." };
    }
    const { data: pub } = supabaseAdmin.storage
      .from("bible-talk-assets")
      .getPublicUrl(path);
    return { success: true as const, url: pub.publicUrl };
  });
