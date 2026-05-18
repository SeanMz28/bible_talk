
CREATE TABLE public.bible_study_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  occupation TEXT NOT NULL CHECK (occupation IN ('working','student')),
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_study_bookings ENABLE ROW LEVEL SECURITY;

-- Public insert (booking form)
CREATE POLICY "Anyone can submit a booking"
  ON public.bible_study_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public select; only service role (backend) can read.
