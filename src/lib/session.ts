import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Stateless session: a signed cookie holding the user id and an expiry.
// Signed with HMAC-SHA256 using SESSION_SECRET, so it can't be forged or edited.

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (32+ characters). Add it to .env, see .env.example.",
    );
  }
  return s;
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(userId: string, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: now + MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the user id if the token is genuine and unexpired, otherwise null. */
export function readToken(token: string, now = Date.now()): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof uid !== "string" || typeof exp !== "number" || exp < now) return null;
    return uid;
  } catch {
    return null;
  }
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.SIMULATE !== "1",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** The signed-in user, or null. Safe to call from pages and route handlers. */
export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = readToken(token);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// ---------- short-lived signed values (used for the Google / Facebook sign-in handshake) ----------

/** A signed, expiring value you can hand to a browser and trust when it comes back. */
export function signPayload(payload: object, ttlMs: number, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: now + ttlMs })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** The payload if the signature is genuine and it hasn't expired, otherwise null. */
export function readPayload<T extends object>(token: string, now = Date.now()): T | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof parsed.exp === "number" && parsed.exp >= now ? (parsed as T) : null;
  } catch {
    return null;
  }
}
