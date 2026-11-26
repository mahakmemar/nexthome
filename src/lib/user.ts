import { db } from "@/lib/db";

export async function getSelfUser() {
  const existing = await db.user.findFirst({ where: { isSelf: true } });
  if (existing) return existing;
  return db.user.create({ data: { name: "You", isSelf: true } });
}
