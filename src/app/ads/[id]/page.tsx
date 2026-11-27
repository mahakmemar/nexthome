import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/db";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { CancelSpotButton } from "@/components/CancelSpotButton";
import { ClaimSection } from "@/components/ClaimSection";
import { bookedSentence, isSlotInPast, parseSlots, slotLabel } from "@/lib/slots";
import { getSessionUser } from "@/lib/session";
import { MAX_ACTIVE_BOOKINGS, countActiveBookings } from "@/lib/bookings";
import { SIZES, categoryLabel } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { formatPrice } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { id } = await params;
  const { slot: initialSlot } = await searchParams;
  const viewer = await getSessionUser();
  const bookedCount = viewer ? await countActiveBookings(viewer.id) : 0;
  const ad = await db.ad.findUnique({ where: { id }, include: { claimedBy: true } });
  if (!ad) notFound();

  const photos: string[] = JSON.parse(ad.photos || "[]");
  // Dated slots expire; only offer the ones that are still ahead.
  const offered = parseSlots(ad.timeSlots);
  const upcoming = offered.filter((slot) => !isSlotInPast(slot));

  return (
    <div className="pb-28">
      <div className="relative">
        <PhotoCarousel photos={photos} alt={ad.title} />
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <span className="pointer-events-none absolute inset-x-0 top-4 text-center text-base font-medium text-white drop-shadow">
          {ad.title}
        </span>
      </div>

      <div className="px-4 py-5">
        <p className="text-sm uppercase tracking-wide text-neutral-400">Pay</p>
        <p className="mb-4 text-4xl font-black text-neutral-900">
          {ad.price > 0 ? formatPrice(Math.round(ad.price)) : "Free"}
        </p>

        <h1 className="text-2xl font-bold text-neutral-900">{ad.title}</h1>
        <p className="mt-1 text-sm text-neutral-400">{timeAgo(ad.createdAt)}</p>

        <p className="mt-4 whitespace-pre-line text-neutral-700">{ad.description}</p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {categoryLabel(ad.category)}
          {ad.subCategory ? ` · ${ad.subCategory}` : ""}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {SIZES.map((size) => (
            <div
              key={size.key}
              className={`rounded-[var(--radius-btn)] border p-3 text-center text-sm font-semibold ${
                size.key === ad.size
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-brand-border text-neutral-400"
              }`}
            >
              {size.label}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 rounded-[var(--radius-card)] bg-neutral-50 p-4 text-sm text-neutral-600">
          <p>
            <span className="font-semibold text-neutral-800">Address: </span>
            {ad.address}
          </p>
          {ad.floor && (
            <p>
              <span className="font-semibold text-neutral-800">Floor: </span>
              {ad.floor} · Elevator: {ad.fitsInElevator ? "Yes" : "No"}
            </p>
          )}
          {ad.placement && (
            <p>
              <span className="font-semibold text-neutral-800">Placement: </span>
              {ad.placement}
            </p>
          )}
        </div>

        {ad.status === "ACTIVE" && (
          <ClaimSection
            adId={ad.id}
            timeSlots={upcoming}
            expired={offered.length > 0 && upcoming.length === 0}
            signedIn={Boolean(viewer)}
            initialSlot={initialSlot}
            atLimit={bookedCount >= MAX_ACTIVE_BOOKINGS}
            maxBookings={MAX_ACTIVE_BOOKINGS}
          />
        )}

        {ad.status === "CLAIMED" && (
          <div className="mt-6 rounded-[var(--radius-card)] bg-brand-green/10 p-4 text-center text-sm font-semibold text-brand-green">
            {viewer && ad.claimedById === viewer.id ? (
              <>
                <p>{bookedSentence(ad.claimedSlot)}</p>
                <p className="mt-1 font-normal">
                  If you can&apos;t make it, cancel your spot as soon as possible.
                </p>
                <CancelSpotButton adId={ad.id} />
              </>
            ) : (
              <>
                <p>{ad.claimedBy ? `${ad.claimedBy.name} is` : "A helper is"} on the way to pick this up.</p>
                {ad.claimedSlot && <p className="mt-1">Time: {slotLabel(ad.claimedSlot)}</p>}
              </>
            )}
          </div>
        )}
        {ad.status === "COMPLETED" && (
          <div className="mt-6 rounded-[var(--radius-card)] bg-neutral-100 p-4 text-center text-sm font-semibold text-neutral-500">
            This task has been completed.
          </div>
        )}
      </div>
    </div>
  );
}
