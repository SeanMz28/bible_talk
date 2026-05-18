import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getCurrentPoster = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("current_poster")
    .select("title, talk_date, poster_url, description, start_time, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
});

export const listRecaps = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("recaps")
    .select("id, title, talk_date, start_time, poster_url, content, created_at")
    .order("talk_date", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
});
