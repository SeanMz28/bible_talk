import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminStatus,
  createRecap,
  deleteRecap,
  updateCurrentPoster,
  uploadPosterImage,
} from "@/lib/admin.functions";
import { getCurrentPoster, listRecaps } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LogOut, Loader2, Trash2, Upload } from "lucide-react";
import logo from "@/assets/bb-logo.jpeg";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Bold Bible Talk" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Recap = {
  id: string;
  title: string;
  talk_date: string;
  poster_url: string | null;
  content: string;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

function nextThursday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 4 Thu .. 6 Sat
  const diff = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(getAdminStatus);
  const loadPoster = useServerFn(getCurrentPoster);
  const loadRecaps = useServerFn(listRecaps);
  const upload = useServerFn(uploadPosterImage);
  const savePoster = useServerFn(updateCurrentPoster);
  const addRecap = useServerFn(createRecap);
  const removeRecap = useServerFn(deleteRecap);

  const [ready, setReady] = useState(false);
  const [poster, setPoster] = useState<{
    title: string;
    talk_date: string;
    start_time: string;
    poster_url: string;
    description: string;
  }>({
    title: "",
    talk_date: nextThursday(),
    start_time: "18:30",
    poster_url: "",
    description: "",
  });
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [newRecap, setNewRecap] = useState({ title: "", talk_date: "", poster_url: "", content: "" });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      try {
        const status = await checkAdmin();
        if (!status.isAdmin) {
          toast.error("This account does not have admin access.");
          await supabase.auth.signOut();
          navigate({ to: "/admin/login" });
          return;
        }
      } catch {
        navigate({ to: "/admin/login" });
        return;
      }
      const [p, r] = await Promise.all([loadPoster(), loadRecaps()]);
      if (p) {
        setPoster({
          title: p.title ?? "",
          talk_date: p.talk_date ?? nextThursday(),
          start_time: (p as any).start_time?.slice(0, 5) ?? "18:30",
          poster_url: p.poster_url ?? "",
          description: (p as any).description ?? "",
        });
      }
      setRecaps(r as Recap[]);
      setReady(true);
    })();
  }, []);

  async function handleUpload(file: File, folder: "current" | "recaps", target: "poster" | "newRecap") {
    setBusy(`upload-${target}`);
    try {
      const base64 = await fileToBase64(file);
      const res = await upload({
        data: {
          filename: sanitizeName(file.name),
          contentType: file.type || "image/jpeg",
          base64,
          folder,
        },
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      if (target === "poster") setPoster((p) => ({ ...p, poster_url: res.url }));
      else setNewRecap((n) => ({ ...n, poster_url: res.url }));
      toast.success("Image uploaded");
    } finally {
      setBusy(null);
    }
  }

  async function handleSavePoster() {
    if (!poster.title || !poster.talk_date || !poster.poster_url) {
      toast.error("Title, date and a poster image are required.");
      return;
    }
    const hasExisting = !!(poster && (poster.title || poster.poster_url));
    if (
      hasExisting &&
      !confirm(
        "Publishing a new upcoming talk will move the current one into Recaps. Continue?",
      )
    ) {
      return;
    }
    setBusy("save-poster");
    try {
      const res = await savePoster({
        data: {
          title: poster.title || null,
          talk_date: poster.talk_date || null,
          start_time: poster.start_time || "18:30",
          poster_url: poster.poster_url || null,
          description: poster.description || null,
        },
      });
      if (res.success) {
        toast.success("Upcoming talk updated");
        setRecaps(await (loadRecaps() as Promise<Recap[]>));
      } else toast.error(res.error ?? "Failed");
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
      const res = await addRecap({
        data: {
          title: newRecap.title,
          talk_date: newRecap.talk_date,
          poster_url: newRecap.poster_url || null,
          content: newRecap.content,
        },
      });
      if (res.success) {
        toast.success("Recap added");
        setNewRecap({ title: "", talk_date: "", poster_url: "", content: "" });
        setRecaps(await (loadRecaps() as Promise<Recap[]>));
      } else {
        toast.error(res.error ?? "Failed");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteRecap(id: string) {
    if (!confirm("Delete this recap?")) return;
    const res = await removeRecap({ data: { id } });
    if (res.success) {
      setRecaps((r) => r.filter((x) => x.id !== id));
      toast.success("Deleted");
    } else toast.error(res.error ?? "Failed");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Bold Bible Talk" className="h-9 w-9 rounded-md" />
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
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "current", "poster")}
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
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "recaps", "newRecap")}
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
          </form>
        </section>

        {/* Existing recaps */}
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-serif text-xl font-semibold">Published recaps ({recaps.length})</h2>
          <div className="mt-4 divide-y divide-border">
            {recaps.map((r) => (
              <div key={r.id} className="flex items-start gap-4 py-4">
                {r.poster_url && (
                  <img src={r.poster_url} alt="" className="h-16 w-12 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.talk_date}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteRecap(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {recaps.length === 0 && <p className="py-6 text-sm text-muted-foreground">No recaps yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
