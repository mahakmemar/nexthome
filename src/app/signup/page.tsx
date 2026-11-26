"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { signupSchema } from "@/lib/validation";

type FieldErrors = Partial<Record<"email" | "password" | "repeatPassword", string>>;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = signupSchema.safeParse({ email, password, repeatPassword });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
        repeatPassword: flat.repeatPassword?.[0],
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors({
          email: body.fieldErrors?.email?.[0],
          password: body.fieldErrors?.password?.[0],
          repeatPassword: body.fieldErrors?.repeatPassword?.[0],
        });
        if (!body.fieldErrors) {
          setErrors({ email: body.error ?? "Something went wrong" });
        }
        return;
      }

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">You&apos;re all set</h1>
        <p className="mt-2 text-neutral-600">Your account has been created with {email}.</p>
        <Link
          href="/"
          className="mt-6 w-full rounded-[var(--radius-btn)] bg-brand-pink py-4 text-center text-base font-bold text-white"
        >
          Go to home
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <h1 className="mb-1 text-center text-2xl font-bold text-neutral-900">Create your account</h1>
      <p className="mb-8 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-blue">
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
          />
        </Field>

        <Field label="Repeat password" error={errors.repeatPassword}>
          <input
            type="password"
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            placeholder="Repeat your password"
            className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[var(--radius-btn)] bg-brand-pink py-4 text-center text-base font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "SIGN UP"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-neutral-800">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}
