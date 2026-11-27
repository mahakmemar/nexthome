import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { startSession } from "@/lib/session";

// Compared against when the email is unknown, so a wrong email and a wrong
// password take about the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  const { email, password } = result.data;
  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await startSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email });
}
