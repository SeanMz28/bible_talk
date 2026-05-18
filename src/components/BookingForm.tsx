import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitBooking } from "@/lib/bookings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export function BookingForm() {
  const submit = useServerFn(submitBooking);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    age: "",
    gender: "" as "" | "male" | "female",
    occupation: "" as "" | "working" | "student",
    phone: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.gender || !form.occupation) {
      toast.error("Please select gender and whether you're working or a student.");
      return;
    }
    const age = parseInt(form.age, 10);
    if (!age || age < 1 || age > 120) {
      toast.error("Please enter a valid age.");
      return;
    }
    setLoading(true);
    try {
      const res = await submit({
        data: {
          name: form.name.trim(),
          surname: form.surname.trim(),
          age,
          gender: form.gender,
          occupation: form.occupation,
          phone: form.phone.trim(),
        },
      });
      if (res.success) {
        setDone(true);
        toast.success("Booking received! We'll be in touch soon.");
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--gold)]" />
        <h3 className="mt-4 text-2xl font-semibold text-foreground">You're booked in</h3>
        <p className="mt-2 text-muted-foreground">
          Thank you. Someone from the team will reach out on the number you provided to set up your first Bible study.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-elegant)]"
    >
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">Book a Bible study</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in your details and we'll be in touch to arrange a time that suits you.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={form.name} onChange={update("name")} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="surname">Surname</Label>
          <Input id="surname" required value={form.surname} onChange={update("surname")} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" required type="number" min={1} max={120} value={form.age} onChange={update("age")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" required type="tel" value={form.phone} onChange={update("phone")} maxLength={30} />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <RadioGroup
            value={form.gender}
            onValueChange={(v) => setForm((f) => ({ ...f, gender: v as "male" | "female" }))}
            className="flex gap-4 pt-1"
          >
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="male" /> Male
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="female" /> Female
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>I am</Label>
          <RadioGroup
            value={form.occupation}
            onValueChange={(v) => setForm((f) => ({ ...f, occupation: v as "working" | "student" }))}
            className="flex gap-4 pt-1"
          >
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="working" /> Working
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="student" /> Student
            </label>
          </RadioGroup>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-[var(--gradient-gold)] text-[var(--gold-foreground)] hover:opacity-90 shadow-[var(--shadow-gold)]"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          "Book my Bible study"
        )}
      </Button>
    </form>
  );
}