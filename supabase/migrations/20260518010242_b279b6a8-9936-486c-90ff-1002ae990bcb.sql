ALTER TABLE public.current_poster
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS start_time time NOT NULL DEFAULT '18:30';

ALTER TABLE public.recaps
  ADD COLUMN IF NOT EXISTS start_time time;