import Link from "next/link";
import { db } from "@/lib/db";
import {
  NEARBY_KM,
  boundingBox,
  formatDistance,
  haversineDistanceKm,
  parseSearchArea,
} from "@/lib/geo";
import { AdCard } from "@/components/AdCard";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { LocationSearch } from "@/components/LocationSearch";
import { getSessionUser } from "@/lib/session";
import { releaseMissedPickups } from "@/lib/auto-release";
import { slotLabel } from "@/lib/slots";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const SHOW_REFERRAL_SECTION = false;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lon?: string; place?: string }>;
}) {
  // A place picked in the search box arrives as ?lat=&lon=&place=. With one, show only
  // ads within NEARBY_KM of it, nearest first. Without one, show the newest ads.
  const area = parseSearchArea(await searchParams);
  // Put missed pick-ups back up before listing, so released ads show as available.
  await releaseMissedPickups();
  let shown: { ad: Awaited<ReturnType<typeof db.ad.findMany>>[number]; km: number | null }[];
  if (area) {
    const box = boundingBox(area.latitude, area.longitude, NEARBY_KM);
    const candidates = await db.ad.findMany({
      where: {
        status: "ACTIVE",
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLon, lte: box.maxLon },
      },
    });
    shown = candidates
      .map((ad) => ({
        ad,
        km: haversineDistanceKm(area.latitude, area.longitude, ad.latitude!, ad.longitude!),
      }))
      .filter((item) => item.km <= NEARBY_KM)
      .sort((a, b) => a.km - b.km)
      .slice(0, 30);
  } else {
    const newest = await db.ad.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    shown = newest.map((ad) => ({ ad, km: null }));
  }
  const sectionTitle = area ? `Active ads near ${area.place}` : "Active ads in your area";

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
      <header className="flex items-center justify-center border-b border-brand-border py-5 pr-24 min-[430px]:pr-0">
        <span className="text-xl font-black italic tracking-tight text-brand-navy min-[430px]:text-2xl">
          SwapCommunity
        </span>
      </header>

      {viewer && (
        <p className="border-b border-brand-border px-4 py-3 text-center text-base font-semibold text-neutral-800">
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

      <LocationSearch key={area ? `${area.latitude},${area.longitude}` : "all"} initialPlace={area?.place} />

      <section className="px-4 py-5">
        <h2 className="text-xl font-bold text-neutral-900">{sectionTitle}</h2>
        {area ? (
          <p className="mb-3 mt-1 text-sm text-neutral-500">
            Within {NEARBY_KM} km, nearest first.{" "}
            <Link href="/" className="font-semibold text-brand-blue">
              Show all ads
            </Link>
          </p>
        ) : (
          <div className="mb-3" />
        )}
        <HorizontalScroller label={sectionTitle}>
          {shown.map(({ ad, km }) => (
            <AdCard
              key={ad.id}
              ad={ad}
              className="w-44 snap-start"
              note={km !== null ? formatDistance(km) : undefined}
            />
          ))}
          {shown.length === 0 &&
            (area ? (
              <p className="text-sm text-neutral-500">
                No active ads within {NEARBY_KM} km of {area.place}.{" "}
                <Link href="/" className="font-semibold text-brand-blue">
                  Show all ads
                </Link>
              </p>
            ) : (
              <p className="text-sm text-neutral-500">
                No active ads yet — be the first to post one.
              </p>
            ))}
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
            Share SwapCommunity with friends and get credits toward your next pick-up.
          </p>
        </section>
      )}
    </div>
  );
}
