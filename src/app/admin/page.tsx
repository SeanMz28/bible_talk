"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LogOut, Loader2, Trash2, Upload, MessageCircle, ExternalLink } from "lucide-react";
import logo from "@/assets/bb-logo.jpeg";
import {
  formatTalkAnnouncement,
  formatRecapAnnouncement,
} from "@/lib/announcements";

const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029Vb7yTp44NVidWgFuEf0R";

async function copyAnnouncement(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied — paste it into your WhatsApp channel.");
  } catch {
    toast.error("Couldn't copy automatically. Select the text and copy manually.");
  }
}

function nextThursday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const isAdmin = useQuery(
    api.auth.isCurrentUserAdmin,
    isAuthenticated ? {} : "skip",
  );
  const posterData = useQuery(api.posters.getCurrent);
  const recaps = useQuery(api.recaps.list);
  const savePoster = useMutation(api.posters.update);
  const addRecap = useMutation(api.recaps.create);
  const removeRecap = useMutation(api.recaps.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getStorageUrl = useMutation(api.storage.getUrl);

  // Upcoming-talk form: blank slate for the next talk, with the date defaulted
  // to the next Thursday at 18:30.
  const [poster, setPoster] = useState({
    title: "",
    talk_date: nextThursday(),
    start_time: "18:30",
    poster_url: "",
    description: "",
  });
  // Recap form: pre-filled from the current talk (admin just writes the content).
  const [newRecap, setNewRecap] = useState({
    title: "",
    talk_date: "",
    poster_url: "",
    content: "",
  });
  const [recapHydrated, setRecapHydrated] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    // Wait until the Convex auth token has settled before judging access —
    // otherwise the isAdmin query briefly reads `false` and bounces admins.
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isAdmin === false) {
      // Signed in, but not an admin — send them home (stay signed in).
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (recapHydrated || !posterData) return;
    setNewRecap({
      title: posterData.title ?? "",
      talk_date: posterData.talkDate ?? "",
      poster_url: posterData.posterUrl ?? "",
      content: "",
    });
    setRecapHydrated(true);
  }, [posterData, recapHydrated]);

  async function handleUpload(file: File, target: "poster" | "newRecap") {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large (max 8MB).");
      return;
    }
    setBusy(`upload-${target}`);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) {
        toast.error("Upload failed.");
        return;
      }
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const url = await getStorageUrl({ storageId });
      if (!url) {
        toast.error("Could not resolve uploaded file URL.");
        return;
      }
      if (target === "poster") setPoster((p) => ({ ...p, poster_url: url }));
      else setNewRecap((n) => ({ ...n, poster_url: url }));
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSavePoster() {
    if (!poster.title || !poster.talk_date || !poster.poster_url) {
      toast.error("Title, date and a poster image are required.");
      return;
    }
    const hasExisting = !!(posterData && (posterData.title || posterData.posterUrl));
    if (
      hasExisting &&
      !confirm(
        "Replace the current upcoming talk with these details? (Publish a recap first if you want to keep a record of it.)",
      )
    ) {
      return;
    }
    setBusy("save-poster");
    try {
      await savePoster({
        title: poster.title || null,
        talkDate: poster.talk_date || null,
        startTime: poster.start_time || "18:30",
        posterUrl: poster.poster_url || null,
        description: poster.description || null,
      });
      toast.success("Upcoming talk updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddRecap(e: React.FormEvent) {
    e.preventDefault();
    if (!newRecap.title || !newRecap.talk_date || !newRecap.content) {
      toast.error("Title, date and recap text are required.");
      return;
    }
    setBusy("add-recap");
    try {
      await addRecap({
        title: newRecap.title,
        talkDate: newRecap.talk_date,
        posterUrl: newRecap.poster_url || null,
        content: newRecap.content,
      });
      toast.success("Recap added");
      setNewRecap({ title: "", talk_date: "", poster_url: "", content: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add recap.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteRecap(id: Id<"recaps">) {
    if (!confirm("Delete this recap?")) return;
    try {
      await removeRecap({ id });
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete.");
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
  }

  if (authLoading || (isAuthenticated && isAdmin === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logo.src} alt="Bold Bible Talk" className="h-9 w-9 rounded-md" />
            <div>
              <p className="font-serif text-base font-semibold leading-none">Bold Bible Talk</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-2">
        {/* Upcoming poster */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Upcoming talk poster</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This appears on the homepage hero.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Talk title</Label>
              <Input
                value={poster.title}
                onChange={(e) => setPoster({ ...poster, title: e.target.value })}
                placeholder="e.g. The Cost of Following Jesus"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={poster.talk_date}
                onChange={(e) => setPoster({ ...poster, talk_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Defaults to the next Thursday.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input
                type="time"
                value={poster.start_time}
                onChange={(e) => setPoster({ ...poster, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Poster image</Label>
              {poster.poster_url && (
                <img src={poster.poster_url} alt="Current poster" className="mb-2 max-h-56 rounded-md border" />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm hover:bg-accent/30">
                <Upload className="h-4 w-4" />
                {busy === "upload-poster" ? "Uploading..." : "Upload new image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "poster")}
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={poster.description}
                onChange={(e) => setPoster({ ...poster, description: e.target.value })}
                placeholder="What's this week's talk about? A short paragraph people will see on the homepage."
                maxLength={20000}
              />
            </div>
            <Button onClick={handleSavePoster} disabled={busy === "save-poster"} className="w-full">
              {busy === "save-poster" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save upcoming talk"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!poster.title || !poster.talk_date) {
                  toast.error("Add a title and date first.");
                  return;
                }
                copyAnnouncement(
                  formatTalkAnnouncement({
                    title: poster.title,
                    talkDate: poster.talk_date,
                    startTime: poster.start_time || "18:30",
                    description: poster.description,
                  }),
                );
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Copy WhatsApp post
            </Button>
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open WhatsApp channel <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* New recap */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold">Add a recap</h2>
          <p className="mt-1 text-sm text-muted-foreground">Publish a recap of a past talk.</p>
          <form className="mt-5 space-y-4" onSubmit={handleAddRecap}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newRecap.title}
                onChange={(e) => setNewRecap({ ...newRecap, title: e.target.value })}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Talk date</Label>
              <Input
                type="date"
                value={newRecap.talk_date}
                onChange={(e) => setNewRecap({ ...newRecap, talk_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Poster image (optional)</Label>
              {newRecap.poster_url && (
                <img src={newRecap.poster_url} alt="" className="mb-2 max-h-40 rounded-md border" />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm hover:bg-accent/30">
                <Upload className="h-4 w-4" />
                {busy === "upload-newRecap" ? "Uploading..." : "Upload poster"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "newRecap")}
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Recap content</Label>
              <Textarea
                rows={10}
                value={newRecap.content}
                onChange={(e) => setNewRecap({ ...newRecap, content: e.target.value })}
                required
                maxLength={20000}
                placeholder="Share verses, key points, discussion takeaways..."
              />
            </div>
            <Button type="submit" disabled={busy === "add-recap"} className="w-full">
              {busy === "add-recap" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish recap"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!newRecap.title || !newRecap.talk_date) {
                  toast.error("Add a title and date first.");
                  return;
                }
                copyAnnouncement(
                  formatRecapAnnouncement({
                    title: newRecap.title,
                    talkDate: newRecap.talk_date,
                    content: newRecap.content,
                  }),
                );
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Copy WhatsApp post
            </Button>
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open WhatsApp channel <ExternalLink className="h-3 w-3" />
            </a>
          </form>
        </section>

        {/* Existing recaps */}
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-serif text-xl font-semibold">
            Published recaps ({recaps?.length ?? 0})
          </h2>
          <div className="mt-4 divide-y divide-border">
            {recaps?.map((r) => (
              <div key={r._id} className="flex items-start gap-4 py-4">
                {r.posterUrl && (
                  <img src={r.posterUrl} alt="" className="h-16 w-12 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.talkDate}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteRecap(r._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {recaps && recaps.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">No recaps yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
