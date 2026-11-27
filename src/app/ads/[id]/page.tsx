import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/db";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { CancelSpotButton } from "@/components/CancelSpotButton";
import { ClaimSection } from "@/components/ClaimSection";
import { RateBuyerForm } from "@/components/RateBuyerForm";
import { ReputationLine } from "@/components/ReputationLine";
import { OUTCOMES, hasPickupStarted } from "@/lib/rating-rules";
import { getReputation } from "@/lib/ratings";
import { releaseMissedPickups } from "@/lib/auto-release";
import { currentMs } from "@/lib/now";
import { getRules } from "@/lib/rules";
import { bookedSentence, isSlotInPast, parseSlots, slotLabel } from "@/lib/slots";
import { getSessionUser } from "@/lib/session";
import { countActiveBookings } from "@/lib/bookings";
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
  await releaseMissedPickups();
  const viewer = await getSessionUser();
  const bookedCount = viewer ? await countActiveBookings(viewer.id) : 0;
  const ad = await db.ad.findUnique({ where: { id }, include: { claimedBy: true } });
  if (!ad) notFound();

  // The poster sees how reliable the buyer has been, and rates the pick-up afterwards.
  const isPoster = Boolean(viewer && ad.posterId === viewer.id);
  const buyerReputation =
    isPoster && ad.claimedById ? await getReputation(ad.claimedById) : null;
  const myRating =
    isPoster && ad.status === "COMPLETED"
      ? await db.rating.findFirst({ where: { adId: ad.id, raterId: ad.posterId } })
      : null;

  // An automatic no-show the poster can still correct ("they actually came").
  const releasedNoShow = isPoster
    ? await db.rating.findFirst({
        where: {
          adId: ad.id,
          source: "SYSTEM",
          correctedAt: null,
          createdAt: { gte: new Date(currentMs() - getRules().undoWindowMs) },
        },
        orderBy: { createdAt: "desc" },
        include: { ratedUser: true },
      })
    : null;

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
            atLimit={bookedCount >= getRules().maxActiveBookings}
            maxBookings={getRules().maxActiveBookings}
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
                {isPoster && buyerReputation && (
                  <p className="mt-2 text-xs font-normal">
                    <ReputationLine reputation={buyerReputation} />
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {ad.status === "CLAIMED" && isPoster && ad.claimedById && (
          hasPickupStarted(ad.claimedSlot) ? (
            <RateBuyerForm adId={ad.id} buyerName={ad.claimedBy?.name ?? "the helper"} />
          ) : (
            <p className="mt-3 text-center text-xs text-neutral-500">
              You can rate the pick-up once the booked time has started.
            </p>
          )
        )}
        {releasedNoShow && (
          <RateBuyerForm
            adId={ad.id}
            buyerName={releasedNoShow.ratedUser.name}
            correctRatingId={releasedNoShow.id}
          />
        )}
        {ad.status === "COMPLETED" && (
          <div className="mt-6 rounded-[var(--radius-card)] bg-neutral-100 p-4 text-center text-sm font-semibold text-neutral-500">
            <p>This task has been completed.</p>
            {myRating && (
              <p className="mt-1 font-normal">
                You rated {ad.claimedBy?.name ?? "the helper"}:{" "}
                {OUTCOMES.find((o) => o.key === myRating.outcome)?.label}
                {myRating.stars ? ` · ${"★".repeat(myRating.stars)}` : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
