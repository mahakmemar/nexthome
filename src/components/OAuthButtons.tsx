/** "Continue with Google / Facebook" buttons and the "or" divider above the email form. */
export function OAuthButtons({ next }: { next?: string }) {
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  // Plain links, not <Link>: they leave the app for Google/Facebook and must not be prefetched.
  const button =
    "flex w-full items-center justify-center gap-3 rounded-[var(--radius-btn)] border border-brand-border bg-white py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50";

  return (
    <div className="mb-6">
      <div className="space-y-3">
        <a href={`/api/auth/google/start${query}`} className={button}>
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </a>
        <a href={`/api/auth/facebook/start${query}`} className={button}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#1877F2" />
            <path fill="#fff" d="M16.67 15.47l.53-3.47h-3.33V9.75c0-.95.47-1.88 1.96-1.88h1.51V4.92s-1.37-.23-2.68-.23c-2.74 0-4.53 1.66-4.53 4.67V12H7.05v3.47h3.08V24h3.74v-8.53h2.8z" />
          </svg>
          Continue with Facebook
        </a>
      </div>
      <div className="mt-6 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-brand-border" />
        or use your email
        <span className="h-px flex-1 bg-brand-border" />
      </div>
    </div>
  );
}
