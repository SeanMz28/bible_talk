"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/bb-logo.jpeg";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const isAdmin = useQuery(
    api.auth.isCurrentUserAdmin,
    isAuthenticated ? {} : "skip",
  );

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState<"google" | "password" | null>(null);

  // Once signed in and the role is known, route by role.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (isAdmin === undefined) return;
    router.replace(isAdmin ? "/admin" : "/");
  }, [authLoading, isAuthenticated, isAdmin, router]);

  async function signInWithGoogle() {
    setSubmitting("google");
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/login",
      });
      if (error) throw new Error(error.message ?? "Google sign-in failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setSubmitting(null);
    }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting("password");
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({ email, password, name: email });
        if (error) throw new Error(error.message ?? "Sign-up failed");
      }
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message ?? "Sign-in failed");
      // The effect above redirects once Convex auth + role resolve.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setSubmitting(null);
    }
  }

  // Signed in — about to redirect; show a spinner instead of the form.
  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <Link href="/" className="flex items-center justify-center gap-2">
          <img src={logo.src} alt="Bold Bible Talk" className="h-12 w-12 rounded-lg" />
        </Link>
        <h1 className="mt-4 text-center font-serif text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Welcome to Bold Bible Talk
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={signInWithGoogle}
          disabled={submitting !== null}
          className="mt-6 w-full"
        >
          {submitting === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">Continue with Google</span>
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => setShowPasswordForm((v) => !v)}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {showPasswordForm ? "Hide email & password" : "Use email & password instead"}
        </button>

        {showPasswordForm && (
          <form onSubmit={onPasswordSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting !== null} className="w-full">
              {submitting === "password" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up & continue"
              )}
            </Button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
