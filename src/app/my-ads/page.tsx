import { db } from "@/lib/db";
import { getSelfUser } from "@/lib/user";
import { AdCard } from "@/components/AdCard";

export const dynamic = "force-dynamic";

export default async function MyAdsPage() {
  const self = await getSelfUser();

  const [posted, claimed] = await Promise.all([
    db.ad.findMany({ where: { posterId: self.id }, orderBy: { createdAt: "desc" } }),
    db.ad.findMany({ where: { claimedById: self.id }, orderBy: { createdAt: "desc" } }),
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
        {claimed.length === 0 ? (
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
