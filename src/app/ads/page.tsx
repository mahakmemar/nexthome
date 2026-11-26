import { db } from "@/lib/db";
import { AdCard } from "@/components/AdCard";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const ads = await db.ad.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 py-5">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">All active ads</h1>
      <div className="grid grid-cols-2 gap-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} className="w-full" />
        ))}
      </div>
      {ads.length === 0 && (
        <p className="text-sm text-neutral-500">No active ads right now.</p>
      )}
    </div>
  );
}
