import { db } from "@/lib/db";
import Link from "next/link";
import { getSelfUser } from "@/lib/user";
import { getSessionUser } from "@/lib/session";
import { releaseMissedPickups } from "@/lib/auto-release";
import { AdCard } from "@/components/AdCard";

export const dynamic = "force-dynamic";

export default async function MyAdsPage() {
  await releaseMissedPickups();
  const self = await getSelfUser();
  // Ads you picked up belong to the account you're logged in with.
  const viewer = await getSessionUser();

  // Ads posted while logged in belong to that account. Older ads belong to the shared
  // "You" user, so those stay in the list too.
  const [posted, claimed] = await Promise.all([
    db.ad.findMany({
      where: { posterId: { in: viewer ? [viewer.id, self.id] : [self.id] } },
      orderBy: { createdAt: "desc" },
    }),
    viewer
      ? db.ad.findMany({ where: { claimedById: viewer.id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="px-4 py-5">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">My ads</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Posted by you
        </h2>
        {posted.length === 0 ? (
          <p className="text-sm text-neutral-500">You haven&apos;t posted any ads yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posted.map((ad) => (
              <AdCard key={ad.id} ad={ad} className="w-full" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Picked up by you
        </h2>
        {!viewer ? (
          <p className="text-sm text-neutral-500">
            <Link href="/login?next=/my-ads" className="font-semibold text-brand-blue">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/signup?next=/my-ads" className="font-semibold text-brand-blue">
              sign up
            </Link>{" "}
            to see ads you&apos;ve picked up.
          </p>
        ) : claimed.length === 0 ? (
          <p className="text-sm text-neutral-500">You haven&apos;t picked up any tasks yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {claimed.map((ad) => (
              <AdCard key={ad.id} ad={ad} className="w-full" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
