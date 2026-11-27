"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { OAuthButtons } from "@/components/OAuthButtons";
import { loginSchema } from "@/lib/validation";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm({ next, error: urlError }: { next?: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push(next ?? "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-10">
      <h1 className="mb-1 text-center text-2xl font-bold text-neutral-900">Log in</h1>
      <p className="mb-8 text-center text-sm text-neutral-500">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-brand-blue"
        >
          Sign up
        </Link>
      </p>

      {urlError && (
        <p role="alert" className="mb-5 rounded-[var(--radius-btn)] bg-red-50 px-4 py-3 text-sm text-red-700">
          {authErrorMessage(urlError)}
        </p>
      )}

      <OAuthButtons next={next} />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-neutral-800">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-neutral-800">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[var(--radius-btn)] bg-brand-pink py-4 text-center text-base font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "LOG IN"}
        </button>
      </form>
    </div>
  );
}
