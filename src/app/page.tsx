import { db } from "@/lib/db";
import { AdCard } from "@/components/AdCard";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { LocationSearch } from "@/components/LocationSearch";
import { getSessionUser } from "@/lib/session";
import { slotLabel } from "@/lib/slots";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const SHOW_REFERRAL_SECTION = false;

export default async function HomePage() {
  const ads = await db.ad.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // The logged-in person's name, and the ads they have booked to pick up.
  const viewer = await getSessionUser();
  const booked = viewer
    ? await db.ad.findMany({
        where: { status: "CLAIMED", claimedById: viewer.id },
        orderBy: { claimedAt: "desc" },
      })
    : [];

  return (
    <div className="pb-6">
      <header className="flex items-center justify-center border-b border-brand-border py-5">
        <span className="text-2xl font-black italic tracking-tight text-brand-navy">
          NextHome
        </span>
      </header>

      {viewer && (
        <p className="border-b border-brand-border px-4 py-3 text-base font-semibold text-neutral-800">
          Hello {viewer.name}
        </p>
      )}

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
        <HorizontalScroller label="Active ads in your area">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} className="w-44 snap-start" />
          ))}
          {ads.length === 0 && (
            <p className="text-sm text-neutral-500">
              No active ads yet — be the first to post one.
            </p>
          )}
        </HorizontalScroller>
      </section>

      {viewer && (
        <section className="px-4 pb-5">
          <h2 className="mb-3 text-xl font-bold text-neutral-900">Ads you have booked to pick up</h2>
          <HorizontalScroller label="Ads you have booked to pick up">
            {booked.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                className="w-44 snap-start"
                note={ad.claimedSlot ? slotLabel(ad.claimedSlot) : undefined}
              />
            ))}
            {booked.length === 0 && (
              <p className="text-sm text-neutral-500">
                You haven&apos;t booked any ads to pick up yet.
              </p>
            )}
          </HorizontalScroller>
        </section>
      )}

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
