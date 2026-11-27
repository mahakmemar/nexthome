import { createHash, randomBytes } from "node:crypto";

// "Sign in with Google / Facebook" using the standard authorization-code flow.
// Nothing here trusts the browser: the callback is tied to the sign-in we started by a
// signed one-time `state`, Google also gets PKCE, and we only read the person's profile
// from the provider's own servers over HTTPS.

export type ProviderId = "google" | "facebook";
export const PROVIDER_IDS: ProviderId[] = ["google", "facebook"];

export function isProvider(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value);
}

export type OAuthProfile = {
  id: string;
  name: string | null;
  email: string | null;
  /** True only when the provider vouches that the person owns this email. */
  emailVerified: boolean;
};

const DEFAULTS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    pkce: true,
  },
  facebook: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/v21.0/me?fields=id,name,email",
    scope: "email,public_profile",
    pkce: false, // Facebook's web flow doesn't use PKCE
  },
} as const;

const CREDENTIALS = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  facebook: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
} as const;

/** The public address of this app, used to build the callback URL given to the provider. */
export function appUrl() {
  const url = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL must be set in production.");
  return "http://localhost:3000";
}

export function redirectUri(provider: ProviderId) {
  return `${appUrl()}/api/auth/${provider}/callback`;
}

/** The provider's settings, or null if its keys haven't been added to .env. */
export function providerConfig(provider: ProviderId) {
  const [idKey, secretKey] = CREDENTIALS[provider];
  const clientId = process.env[idKey]?.trim();
  const clientSecret = process.env[secretKey]?.trim();
  if (!clientId || !clientSecret) return null;

  const d = DEFAULTS[provider];
  const prefix = provider.toUpperCase();
  // Addresses can be redirected to a test server, but never in production.
  const override = (suffix: string, fallback: string) =>
    process.env.NODE_ENV !== "production" ? (process.env[`${prefix}_${suffix}`] ?? fallback) : fallback;

  return {
    clientId,
    clientSecret,
    scope: d.scope,
    pkce: d.pkce,
    authUrl: override("AUTH_URL", d.authUrl),
    tokenUrl: override("TOKEN_URL", d.tokenUrl),
    profileUrl: override("PROFILE_URL", d.profileUrl),
  };
}

export function newState() {
  return randomBytes(24).toString("base64url");
}

export function newVerifier() {
  return randomBytes(32).toString("base64url");
}

function challengeFor(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function authorizeUrl(
  provider: ProviderId,
  config: NonNullable<ReturnType<typeof providerConfig>>,
  state: string,
  verifier?: string,
) {
  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (config.pkce && verifier) {
    url.searchParams.set("code_challenge", challengeFor(verifier));
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url;
}

/** Swap the one-time code for an access token. Returns null on any failure. */
export async function exchangeCode(provider: ProviderId, code: string, verifier?: string) {
  const config = providerConfig(provider);
  if (!config) return null;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(provider),
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  if (config.pkce && verifier) body.set("code_verifier", verifier);

  try {
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  }
}

/** Ask the provider who this access token belongs to. */
export async function fetchProfile(provider: ProviderId, accessToken: string): Promise<OAuthProfile | null> {
  const config = providerConfig(provider);
  if (!config) return null;

  try {
    const url = new URL(config.profileUrl);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (provider === "google") headers.Authorization = `Bearer ${accessToken}`;
    else url.searchParams.set("access_token", accessToken);

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = await res.json();

    if (provider === "google") {
      if (typeof data.sub !== "string") return null;
      return {
        id: data.sub,
        name: typeof data.name === "string" ? data.name : null,
        email: typeof data.email === "string" ? data.email : null,
        // Google says whether it has confirmed the address.
        emailVerified: data.email_verified === true || data.email_verified === "true",
      };
    }

    if (typeof data.id !== "string") return null;
    return {
      id: data.id,
      name: typeof data.name === "string" ? data.name : null,
      email: typeof data.email === "string" ? data.email : null,
      // Facebook doesn't promise the address is confirmed, so we never rely on it.
      emailVerified: false,
    };
  } catch {
    return null;
  }
}
