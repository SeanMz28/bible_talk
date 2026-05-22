import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    name: v.string(),
    surname: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    occupation: v.union(v.literal("working"), v.literal("student")),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const surname = args.surname.trim();
    const phone = args.phone.trim();
    if (name.length < 1 || name.length > 80) throw new Error("Invalid name");
    if (surname.length < 1 || surname.length > 80)
      throw new Error("Invalid surname");
    if (phone.length < 5 || phone.length > 30) throw new Error("Invalid phone");
    if (!Number.isInteger(args.age) || args.age < 1 || args.age > 120)
      throw new Error("Invalid age");
    await ctx.db.insert("bookings", {
      name,
      surname,
      phone,
      age: args.age,
      gender: args.gender,
      occupation: args.occupation,
    });
  },
});
