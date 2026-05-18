
DROP POLICY "Anyone can submit a booking" ON public.bible_study_bookings;

CREATE POLICY "Anyone can submit a valid booking"
  ON public.bible_study_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 80
    AND length(surname) BETWEEN 1 AND 80
    AND length(phone) BETWEEN 5 AND 30
    AND age BETWEEN 1 AND 120
    AND gender IN ('male','female')
    AND occupation IN ('working','student')
  );
