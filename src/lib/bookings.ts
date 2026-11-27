import { db } from "@/lib/db";

/** Ads this user has booked and not yet finished or cancelled. */
export function countActiveBookings(userId: string) {
  return db.ad.count({ where: { status: "CLAIMED", claimedById: userId } });
}

export const bookingLimitMessage = (max: number) =>
  `You can have up to ${max} ads booked at a time. Cancel one to book another.`;
