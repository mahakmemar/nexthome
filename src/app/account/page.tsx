import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { ReputationLine } from "@/components/ReputationLine";
import { getReputation } from "@/lib/ratings";
import { db } from "@/lib/db";
import { releaseMissedPickups } from "@/lib/auto-release";
import { currentMs } from "@/lib/now";
import { getRules } from "@/lib/rules";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <UserCircleIcon className="h-20 w-20 text-neutral-300" />
        <h1 className="text-xl font-bold text-neutral-900">You&apos;re not logged in</h1>
        <p className="text-sm text-neutral-500">Log in or sign up to pick up ads.</p>
        <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-2">
          <Link
            href="/login"
            className="rounded-[var(--radius-btn)] border border-brand-navy py-3 text-sm font-bold text-brand-navy"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-[var(--radius-btn)] bg-brand-navy py-3 text-sm font-bold text-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  await releaseMissedPickups();
  const reputation = await getReputation(user.id);
  // Bookings the system released because the pick-up time passed (still open to correction).
  const missed = await db.rating.findMany({
    where: {
      ratedUserId: user.id,
      source: "SYSTEM",
      correctedAt: null,
      createdAt: { gte: new Date(currentMs() - getRules().undoWindowMs) },
    },
    include: { ad: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <UserCircleIcon className="h-20 w-20 text-brand-navy" />
      <h1 className="text-xl font-bold text-neutral-900">{user.name}</h1>
      {user.email && <p className="text-sm text-neutral-500">{user.email}</p>}
      {missed.map((m) => (
        <div
          key={m.id}
          role="status"
          className="w-full max-w-sm rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700"
        >
          Your pick-up of &ldquo;{m.ad.title}&rdquo; was released because the time passed. It counts
          as a no-show unless the poster says you came.
        </div>
      ))}
      <p className="text-sm">
        <span className="font-semibold text-neutral-800">Your pick-up record: </span>
        <ReputationLine reputation={reputation} />
      </p>
      <p className="text-sm text-neutral-500">
        Payment methods and verification aren&apos;t part of this clone yet.
      </p>
      <LogoutButton />
    </div>
  );
}
