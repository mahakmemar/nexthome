import { db } from "@/lib/db";
import type { OAuthProfile, ProviderId } from "@/lib/oauth";

type Result =
  | { user: { id: string } }
  | { error: "email_unverified" | "email_taken" | "failed" };

/**
 * Find the user for a Google/Facebook sign-in, or create one.
 *
 * Rules, chosen so nobody can take over an account:
 *  - The person is recognised by the provider's own account id, never by email.
 *  - We never attach a Google/Facebook login to an EXISTING account that has the same
 *    email. Our own sign-ups don't confirm email addresses, so that could hand an
 *    account to someone who merely typed another person's email.
 *  - We only save an email we know is confirmed (Google says so; Facebook doesn't).
 */
export async function signInWithProvider(provider: ProviderId, profile: OAuthProfile): Promise<Result> {
  const existing = await db.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.id } },
    select: { user: { select: { id: true } } },
  });
  if (existing) return { user: existing.user };

  const email = profile.emailVerified && profile.email ? profile.email.trim().toLowerCase() : null;
  if (provider === "google" && !email) return { error: "email_unverified" };

  if (email) {
    const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return { error: "email_taken" };
  }

  const name = profile.name?.trim() || email?.split("@")[0] || "New user";
  try {
    const user = await db.user.create({
      data: { name, email, oauthAccounts: { create: { provider, providerAccountId: profile.id } } },
      select: { id: true },
    });
    return { user };
  } catch {
    // Most likely two sign-ins at the same moment; the next attempt will find the account.
    return { error: "failed" };
  }
}
