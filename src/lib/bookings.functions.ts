import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const bookingSchema = z.object({
  name: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["male", "female"]),
  occupation: z.enum(["working", "student"]),
  phone: z.string().trim().min(5).max(30),
});

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("bible_study_bookings")
      .insert(data);
    if (error) {
      console.error("Booking insert failed:", error);
      return { success: false, error: "Could not save your booking. Please try again." };
    }
    return { success: true };
  });