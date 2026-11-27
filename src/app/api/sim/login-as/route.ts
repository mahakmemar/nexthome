import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardSim } from "@/lib/sim/guard";
import { startSession } from "@/lib/session";
import { PERSONAS } from "@/lib/sim/scenarios";

// Body: { "persona": "poster" }  or  { "email": "someone@example.com" }. No password needed.
export async function POST(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  const body = (await req.json().catch(() => null)) as { persona?: string; email?: string } | null;
  const email =
    body?.persona && body.persona in PERSONAS
      ? PERSONAS[body.persona as keyof typeof PERSONAS].email
      : body?.email;
  if (!email) return NextResponse.json({ error: "Send a persona or an email" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "No such user. Load a scenario first." }, { status: 404 });
  await startSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
