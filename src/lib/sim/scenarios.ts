// Ready-made starting points for simulate mode. Loading one wipes the simulate database,
// creates the same four people every time, builds the scenario's ads, and sets a frozen clock
// (Saturday 5 Dec 2026, 09:00 server time) so a test always begins from the same moment.

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { writeState } from "@/lib/sim/state";

export const PERSONAS = {
  poster: { name: "Pat Poster", email: "poster@sim.test" },
  buyer: { name: "Bea Buyer", email: "buyer@sim.test" },
  buyer2: { name: "Ben Second", email: "buyer2@sim.test" },
  flaky: { name: "Fay Flaky", email: "flaky@sim.test" },
} as const;

export type Persona = keyof typeof PERSONAS;

/** Everyone can also log in the normal way with this password. */
export const SIM_PASSWORD = "simulate123";

export const SCENARIO_NAMES = ["empty", "booked-ads", "buyer-at-limit", "flaky-buyer"] as const;

export const SCENARIO_DESCRIPTIONS: Record<(typeof SCENARIO_NAMES)[number], string> = {
  empty: "Just the four people, no ads.",
  "booked-ads": "Bea booked a 10:00-11:00 slot, Ben booked an ASAP and an anytime ad, plus one open ad.",
  "buyer-at-limit": "Bea already has 5 bookings (the limit). One more open ad.",
  "flaky-buyer": "Fay has 2 on time, 1 late and 3 no-shows, and one booking for 10:00-11:00.",
};
export type ScenarioName = (typeof SCENARIO_NAMES)[number];

/** Every scenario starts here: Saturday 5 Dec 2026, 09:00 (server local time). */
export const START = new Date(2026, 11, 5, 9, 0, 0);
export const SLOT_TODAY_10 = "2026-12-05@10-11";
export const SLOT_TODAY_14 = "2026-12-05@14-15";
export const SLOT_TOMORROW_10 = "2026-12-06@10-11";

type AdOverrides = Partial<{
  title: string;
  timeSlots: string[];
  status: "ACTIVE" | "CLAIMED" | "COMPLETED";
  claimedById: string;
  claimedSlot: string;
}>;

function adData(posterId: string, over: AdOverrides = {}) {
  const claimed = over.claimedById ? { claimedById: over.claimedById, claimedAt: START, claimedSlot: over.claimedSlot ?? null } : {};
  return {
    title: over.title ?? "Free bookshelf",
    description: "Solid wood bookshelf, you carry it away.",
    category: "GIVE_AWAY" as const,
    subCategory: "Furniture",
    size: "M" as const,
    photos: JSON.stringify(["https://picsum.photos/seed/sim-shelf/900/700"]),
    address: "800 Robson St, Vancouver, BC",
    latitude: 49.2827,
    longitude: -123.1207,
    timeSlots: JSON.stringify(over.timeSlots ?? [SLOT_TODAY_10]),
    price: 0,
    serviceFee: 0,
    total: 0,
    posterId,
    status: over.status ?? (over.claimedById ? ("CLAIMED" as const) : ("ACTIVE" as const)),
    createdAt: START,
    ...claimed,
  };
}

async function wipe() {
  await db.rating.deleteMany();
  await db.ad.deleteMany();
  await db.oAuthAccount.deleteMany();
  await db.user.deleteMany();
}

export async function loadScenario(name: ScenarioName) {
  writeState({ clock: { anchorReal: Date.now(), anchorSim: START.getTime(), speed: 0 }, rules: {} });
  await wipe();

  const passwordHash = await bcrypt.hash(SIM_PASSWORD, 4);
  const users: Record<string, string> = {};
  for (const [key, p] of Object.entries(PERSONAS)) {
    users[key] = (await db.user.create({ data: { ...p, passwordHash, createdAt: START } })).id;
  }
  const ads: Record<string, string> = {};
  const add = async (key: string, over?: AdOverrides) => {
    ads[key] = (await db.ad.create({ data: adData(users.poster, over) })).id;
  };
  const rate = (adKey: string, outcome: "ON_TIME" | "LATE" | "NO_SHOW", stars: number | null) =>
    db.rating.create({
      data: { adId: ads[adKey], raterId: users.poster, ratedUserId: users.flaky, outcome, stars, createdAt: START },
    });

  if (name === "booked-ads") {
    // One of each kind of booking: a dated slot, "as soon as possible", "anytime", and an open ad.
    await add("dated", { title: "Free bookshelf (dated slot)", claimedById: users.buyer, claimedSlot: SLOT_TODAY_10 });
    await add("asap", { title: "Free lamp (as soon as possible)", timeSlots: ["asap"], claimedById: users.buyer2, claimedSlot: "asap" });
    await add("anytime", { title: "Free chair (anytime)", timeSlots: ["anytime"], claimedById: users.buyer2, claimedSlot: "anytime" });
    await add("open", { title: "Free desk (open to book)", timeSlots: [SLOT_TODAY_14, SLOT_TOMORROW_10] });
  }

  if (name === "buyer-at-limit") {
    // Bea already has the maximum number of bookings (5), and there is one more ad she could try.
    for (let i = 1; i <= 5; i++) {
      await add(`booked${i}`, { title: `Free item ${i} (booked by Bea)`, timeSlots: ["anytime"], claimedById: users.buyer, claimedSlot: "anytime" });
    }
    await add("open", { title: "Free desk (open to book)", timeSlots: ["anytime"] });
  }

  if (name === "flaky-buyer") {
    // Fay has a history: 2 on time (5 stars), 1 late (3 stars), 3 no-shows. She has one booking now.
    const history: ["ON_TIME" | "LATE" | "NO_SHOW", number | null][] = [
      ["ON_TIME", 5], ["ON_TIME", 5], ["LATE", 3], ["NO_SHOW", null], ["NO_SHOW", null], ["NO_SHOW", null],
    ];
    for (const [i, [outcome]] of history.entries()) {
      await add(`past${i + 1}`, { title: `Past pick-up ${i + 1}`, timeSlots: ["anytime"], status: outcome === "NO_SHOW" ? "ACTIVE" : "COMPLETED" });
    }
    for (const [i, [outcome, stars]] of history.entries()) await rate(`past${i + 1}`, outcome, stars);
    await add("booked", { title: "Free bookshelf (booked by Fay)", claimedById: users.flaky, claimedSlot: SLOT_TODAY_10 });
    await add("open", { title: "Free desk (open to book)", timeSlots: [SLOT_TODAY_14, SLOT_TOMORROW_10] });
  }

  return { scenario: name, now: START.toISOString(), users, ads };
}
