import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, authorizeUrl, isProvider, newState, newVerifier, providerConfig } from "@/lib/oauth";
import { safeNext } from "@/lib/redirect";
import { signPayload } from "@/lib/session";

export const OAUTH_COOKIE = "oauth_state";
const HANDSHAKE_MINUTES = 10;

// Step 1: send the person to Google/Facebook. We remember a random `state` (and a PKCE
// secret for Google) in a signed, short-lived cookie, and check it when they come back.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) return new Response("Not found", { status: 404 });

  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const config = providerConfig(provider);
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=not_configured", appUrl()));
  }

  const state = newState();
  const verifier = config.pkce ? newVerifier() : undefined;

  (await cookies()).set(
    OAUTH_COOKIE,
    signPayload({ provider, state, verifier, next }, HANDSHAKE_MINUTES * 60 * 1000),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // must come back with the provider's redirect
      path: "/api/auth",
      maxAge: HANDSHAKE_MINUTES * 60,
    },
  );

  return NextResponse.redirect(authorizeUrl(provider, config, state, verifier));
}
