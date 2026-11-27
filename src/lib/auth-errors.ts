const MESSAGES: Record<string, string> = {
  not_configured: "That sign-in option isn't set up yet. Use your email and password for now.",
  denied: "Sign-in was cancelled. You can try again or use your email and password.",
  failed: "We couldn't sign you in with that account. Please try again.",
  email_unverified: "Google hasn't confirmed that email address, so we can't use it. Use another account.",
  email_taken:
    "An account with that email already exists. Log in with your email and password instead.",
};

/** A friendly message for a sign-in error code from the address bar, or null. */
export function authErrorMessage(code: string | undefined) {
  return code ? (MESSAGES[code] ?? MESSAGES.failed) : null;
}
