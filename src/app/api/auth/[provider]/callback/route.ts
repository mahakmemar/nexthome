import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, exchangeCode, fetchProfile, isProvider } from "@/lib/oauth";
import { signInWithProvider } from "@/lib/oauth-users";
import { safeNext } from "@/lib/redirect";
import { readPayload, startSession } from "@/lib/session";

type Handshake = { provider: string; state: string; verifier?: string; next: string };

// Step 2: Google/Facebook sends the person back here with a one-time `code`.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) return new Response("Not found", { status: 404 });

  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, appUrl()));

  // The handshake cookie works once: read it, then delete it, whatever happens next.
  const store = await cookies();
  const raw = store.get("oauth_state")?.value;
  store.delete({ name: "oauth_state", path: "/api/auth" });

  const query = req.nextUrl.searchParams;
  if (query.get("error")) return fail(query.get("error") === "access_denied" ? "denied" : "failed");

  const handshake = raw ? readPayload<Handshake>(raw) : null;
  const code = query.get("code");
  const state = query.get("state");
  if (!handshake || handshake.provider !== provider || !code || !state) return fail("failed");

  // Proves this callback belongs to a sign-in that THIS browser started.
  const expected = Buffer.from(handshake.state);
  const given = Buffer.from(state);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return fail("failed");

  const accessToken = await exchangeCode(provider, code, handshake.verifier);
  if (!accessToken) return fail("failed");

  const profile = await fetchProfile(provider, accessToken);
  if (!profile) return fail("failed");

  const result = await signInWithProvider(provider, profile);
  if ("error" in result) return fail(result.error);

  await startSession(result.user.id);
  return NextResponse.redirect(new URL(safeNext(handshake.next), appUrl()));
}
