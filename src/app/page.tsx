import { db } from "@/lib/db";
import { AdCard } from "@/components/AdCard";
import { LocationSearch } from "@/components/LocationSearch";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const SHOW_REFERRAL_SECTION = false;

export default async function HomePage() {
  const ads = await db.ad.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="pb-6">
      <header className="flex items-center justify-center border-b border-brand-border py-5">
        <span className="text-2xl font-black italic tracking-tight text-brand-navy">
          NextHome
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2 border-b border-brand-border px-4 py-5 text-center text-xs text-neutral-500">
        <div className="flex flex-col items-center gap-1">
          <BoltIcon className="h-5 w-5 text-neutral-400" />
          <p className="font-semibold text-neutral-700">Quick</p>
          <p>Get help right away</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CreditCardIcon className="h-5 w-5 text-neutral-400" />
          <p className="font-semibold text-neutral-700">Smooth</p>
          <p>Pay in-app</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShieldCheckIcon className="h-5 w-5 text-neutral-400" />
          <p className="font-semibold text-neutral-700">Safe</p>
          <p>Verified helpers</p>
        </div>
      </div>

      <LocationSearch />

      <section className="px-4 py-5">
        <h2 className="mb-3 text-xl font-bold text-neutral-900">Active ads in your area</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} className="w-44" />
          ))}
          {ads.length === 0 && (
            <p className="text-sm text-neutral-500">
              No active ads yet — be the first to post one.
            </p>
          )}
        </div>
      </section>

      {SHOW_REFERRAL_SECTION && (
        <section className="mx-4 rounded-[var(--radius-card)] bg-neutral-50 px-5 py-8 text-center">
          <UserGroupIcon className="mx-auto mb-3 h-10 w-10 text-brand-navy" />
          <h2 className="text-xl font-bold text-neutral-900">Earn credits by inviting friends</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Share NextHome with friends and get credits toward your next pick-up.
          </p>
        </section>
      )}
    </div>
  );
}
