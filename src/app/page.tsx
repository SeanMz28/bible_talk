"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Calendar,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  BookOpen,
  Users,
  Heart,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import fallbackPoster from "@/assets/bible-talk-poster.jpg";
import logo from "@/assets/bb-logo.jpeg";
import { BookingForm } from "@/components/BookingForm";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";

const WHATSAPP_URL = "https://whatsapp.com/channel/0029Vb7yTp44NVidWgFuEf0R";
const INSTAGRAM_URL = "https://www.instagram.com/joburg.icc/";

export default function HomePage() {
  const poster = useQuery(api.posters.getCurrent);
  const { isAuthenticated } = useConvexAuth();
  const isAdmin = useQuery(
    api.auth.isCurrentUserAdmin,
    isAuthenticated ? {} : "skip",
  );

  const isLoadingPoster = poster === undefined;
  const posterSrc = poster?.posterUrl || fallbackPoster.src;
  const upcomingTitle = poster?.title;
  const upcomingDate = poster?.talkDate;
  const upcomingDescription = poster?.description;
  const upcomingTime = poster?.startTime?.slice(0, 5) || "18:30";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* NAV */}
      <nav className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src={logo.src}
              alt="Bold Bible Talk logo"
              className="h-10 w-10 rounded-md bg-card object-cover"
            />
            <span className="font-serif text-base font-semibold text-primary-foreground sm:text-lg">
              Bold Bible Talk
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-4 py-2 text-sm font-medium text-[var(--gold)] hover:bg-[var(--gold)]/20"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Channel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/30 text-primary-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/30 text-primary-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <Link
              href="/recaps"
              className="rounded-md border border-primary-foreground/30 px-4 py-2 text-sm font-medium text-primary-foreground hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              Recaps
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="relative overflow-hidden pt-20"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_20%,oklch(0.78_0.13_85_/_0.4),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-6 py-16 text-primary-foreground sm:py-24 md:max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--gold)]">
            <BookOpen className="h-3.5 w-3.5" /> Bold Bible Talk · Weekly
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Open Discussion. <span className="text-[var(--gold)]">Everyone invited.</span>
          </h1>
          {isLoadingPoster ? (
            <div className="mt-6 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
              <Skeleton className="h-3 w-24 bg-primary-foreground/15" />
              <Skeleton className="mt-3 h-8 w-3/4 bg-primary-foreground/15" />
              <Skeleton className="mt-4 aspect-[4/5] w-full rounded-2xl bg-primary-foreground/10" />
              <div className="mt-4 space-y-2.5">
                <Skeleton className="h-3.5 w-full bg-primary-foreground/10" />
                <Skeleton className="h-3.5 w-11/12 bg-primary-foreground/10" />
                <Skeleton className="h-3.5 w-4/5 bg-primary-foreground/10" />
              </div>
            </div>
          ) : upcomingTitle ? (
            <div className="mt-6 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
              <div className="md:grid md:grid-cols-2 md:items-center md:gap-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--gold)] md:col-start-2 md:row-start-1">
                  This week's talk
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-primary-foreground sm:text-3xl md:col-start-2 md:row-start-2 md:mt-1">
                  {upcomingTitle}
                </h2>
                <div className="relative mt-4 md:col-start-1 md:row-span-3 md:row-start-1 md:mt-0">
                  <div className="absolute -inset-2 rounded-3xl bg-[var(--gold)]/20 blur-2xl" />
                  <img
                    src={posterSrc}
                    alt={`${upcomingTitle} poster`}
                    className="relative w-full rounded-2xl shadow-[var(--shadow-elegant)]"
                  />
                </div>
                {upcomingDescription && (
                  <p className="mt-4 whitespace-pre-wrap text-sm text-primary-foreground/85 sm:text-base md:col-start-2 md:row-start-3 md:mt-3">
                    {upcomingDescription}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="max-w-lg text-base text-primary-foreground/80 sm:text-lg">
                Join us every Thursday for an honest, friendly discussion of God's word — over a meal, with real people, real questions, and real answers from Scripture.
              </p>
              <div className="relative mx-auto mt-6 w-full max-w-sm">
                <div className="absolute -inset-4 rounded-3xl bg-[var(--gold)]/20 blur-2xl" />
                <img
                  src={posterSrc}
                  alt="Bold Bible Talk poster"
                  className="relative w-full rounded-2xl shadow-[var(--shadow-elegant)]"
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 text-primary-foreground/90 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--gold)]" />
              {isLoadingPoster ? (
                <Skeleton className="h-4 w-32 bg-primary-foreground/15" />
              ) : upcomingDate ? (
                new Date(upcomingDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              ) : (
                "Every Thursday"
              )}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--gold)]" />
              {isLoadingPoster ? <Skeleton className="h-4 w-12 bg-primary-foreground/15" /> : upcomingTime}
            </span>
            <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[var(--gold)]" /> Mochachos, Rosebank Mall</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#book"
              style={{ backgroundImage: "var(--gradient-gold)" }}
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-[var(--gold-foreground)] shadow-[var(--shadow-gold)] transition hover:opacity-90"
            >
              Book a Bible study
            </a>
            <Link
              href="/recaps"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Past recaps <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            What is Bold Bible Talk?
          </h2>
          <p className="mt-4 text-muted-foreground">
            A relaxed, weekly gathering at Mochachos in Rosebank Mall where we open the Bible together, discuss a passage or theme, and share life. Everyone is welcome — whether it's your first time reading the Bible or your hundredth.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Users, title: "Real community", text: "Friendly people from every background and stage of life." },
            { icon: BookOpen, title: "Real Scripture", text: "We dig into the Bible itself — no pressure, no judgment, just honest discussion." },
            { icon: Heart, title: "Real conversations", text: "Bring your questions, doubts and curiosities. Nothing is off the table." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOOKING */}
      <section id="book" className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Book a one-on-one Bible study
            </h2>
            <p className="mt-4 text-muted-foreground">
              Want to go deeper than a Thursday evening allows? Sign up for a free, no-pressure personal Bible study. We'll meet you where you are — at a coffee shop, on campus, or online — and walk through the Bible together at your pace.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Free and at your own pace</li>
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Honest answers from Scripture</li>
              <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> No obligation — stop any time</li>
            </ul>
          </div>
          <BookingForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <img src={logo.src} alt="Bold Bible Talk" className="h-12 w-12 rounded-md" />
          <h3 className="font-serif text-2xl font-semibold">Stay connected</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Follow along for weekly encouragement, talk previews and event updates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Channel
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <Instagram className="h-4 w-4" /> @joburg.icc
            </a>
            <Link
              href="/recaps"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <BookOpen className="h-4 w-4" /> Past recaps
            </Link>
          </div>
          <p className="pt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bold Bible Talk · Rosebank Mall ·{" "}
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
