import { db } from "@/lib/db";
import { summarize, type Reputation } from "@/lib/rating-rules";

// Server-only: reads ratings from the database. Client components must import
// from "@/lib/rating-rules" instead, which has no database code in it.

export async function getReputation(userId: string): Promise<Reputation> {
  const rows = await db.rating.findMany({
    where: { ratedUserId: userId },
    select: { outcome: true, stars: true },
  });
  return summarize(rows);
}
