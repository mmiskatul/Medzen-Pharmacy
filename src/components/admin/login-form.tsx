"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          remember: form.get("remember") === "on",
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Sign-in failed. Try again.");
        return;
      }

      // The destination comes from middleware and is always a same-site
      // path; anything else falls back to the dashboard root.
      const next = params.get("next");
      const destination = next?.startsWith("/admin") ? next : "/admin";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Email address" htmlFor="login-email">
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="you@medzen.local"
        />
      </Field>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-wash hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="remember"
            className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
          />
          Keep me signed in
        </label>
        <a
          href="/admin/forgot-password"
          className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Forgot password?
        </a>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        <LogIn />
        Sign in
      </Button>
    </form>
  );
}
