"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Calendar } from "lucide-react";
import logo from "@/assets/bb-logo.jpeg";

export default function RecapsPage() {
  const data = useQuery(api.recaps.list);
  const isLoading = data === undefined;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logo.src} alt="Bold Bible Talk" className="h-9 w-9 rounded-md" />
            <span className="font-serif font-semibold">Bold Bible Talk</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--gold)]">
            Past discussions
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold">Recaps</h1>
          <p className="mt-3 text-muted-foreground">
            Missed a Thursday? Catch up on what we've been discussing together.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {isLoading && <p className="text-center text-muted-foreground">Loading...</p>}
          {!isLoading && data.length === 0 && (
            <p className="text-center text-muted-foreground">No recaps published yet.</p>
          )}
          {data?.map((r) => (
            <article
              key={r._id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              {r.posterUrl && (
                <img
                  src={r.posterUrl}
                  alt={r.title}
                  className="aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
                />
              )}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(r.talkDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {r.startTime && <span>· {r.startTime.slice(0, 5)}</span>}
                </div>
                <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{r.title}</h2>
                <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-foreground/85">
                  {r.content}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
