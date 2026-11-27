// Adds demo ads so the home page rows have enough cards to scroll:
//   10 more ACTIVE ads ("Active ads in your area"), and
//   10 ads BOOKED by one account ("Ads you have booked to pick up").
// Re-running replaces only the demo-* ads. It never touches seed-1..4 or any real ad.
//
//   npm run seed:demo                      -> bookings go to the oldest real account
//   SEED_BOOKED_FOR=you@example.com npm run seed:demo
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

// Reuse the same few images the original seed uses.
const IMAGES = [
  { seed: "garden", count: 3 },
  { seed: "bike", count: 2 },
  { seed: "furniture", count: 3 },
  { seed: "teddy", count: 1 },
];
function photos(i: number) {
  const { seed, count } = IMAGES[i % IMAGES.length];
  return JSON.stringify(
    Array.from({ length: count }, (_, n) => `https://picsum.photos/seed/${seed}-${n}/900/700`),
  );
}

type Category = "MOVE_DELIVER" | "BUY_FOR_ME" | "REMOVE_RECYCLE" | "GIVE_AWAY";
type Size = "S" | "M" | "L" | "XL";
type Demo = {
  title: string;
  description: string;
  category: Category;
  subCategory: string;
  size: Size;
  price: number;
  slots: string[];
};

const ACTIVE: Demo[] = [
  { title: "Move a bookshelf", description: "Bookshelf to carry down two floors and into a van.", category: "MOVE_DELIVER", subCategory: "Small moves", size: "M", price: 300, slots: ["21-22", "22-23", "23-00"] },
  { title: "Pick up groceries", description: "Weekly grocery run, list is ready and paid in advance.", category: "BUY_FOR_ME", subCategory: "Grocery run", size: "S", price: 120, slots: ["asap"] },
  { title: "Old sofa removal", description: "Three-seat sofa to take to the recycling centre.", category: "REMOVE_RECYCLE", subCategory: "Furniture", size: "XL", price: 700, slots: ["00-01", "01-02", "07-08", "08-09"] },
  { title: "Free kids' bike", description: "Kids' bike in good shape, free to whoever picks it up.", category: "GIVE_AWAY", subCategory: "Other items", size: "M", price: 0, slots: ["anytime"] },
  { title: "Deliver a parcel across town", description: "Small parcel from a shop to an address in Solna.", category: "MOVE_DELIVER", subCategory: "From a store", size: "S", price: 90, slots: ["21-22", "23-00"] },
  { title: "Buy paint at the hardware store", description: "Two cans of white wall paint, I will send the exact product.", category: "BUY_FOR_ME", subCategory: "Hardware store", size: "M", price: 200, slots: ["22-23", "00-01", "02-03"] },
  { title: "Electronics recycling", description: "Box of old cables, a printer and a monitor.", category: "REMOVE_RECYCLE", subCategory: "Electronics", size: "S", price: 150, slots: ["asap"] },
  { title: "Free winter clothes", description: "Bag of winter jackets and boots, adult sizes.", category: "GIVE_AWAY", subCategory: "Clothes", size: "S", price: 0, slots: ["21-22", "22-23", "23-00", "00-01", "01-02"] },
  { title: "Move boxes to storage", description: "About ten boxes from the flat to a storage unit nearby.", category: "MOVE_DELIVER", subCategory: "Small moves", size: "L", price: 450, slots: ["05-06", "06-07", "07-08"] },
  { title: "Pick up a prescription", description: "Collect a prescription from the pharmacy on Solnavägen.", category: "BUY_FOR_ME", subCategory: "Pharmacy", size: "S", price: 80, slots: ["anytime"] },
];

const BOOKED: Demo[] = [
  { title: "Pick up a desk lamp", description: "Desk lamp, free. Left in the hallway.", category: "GIVE_AWAY", subCategory: "Other items", size: "S", price: 0, slots: ["21-22", "22-23"] },
  { title: "Garden waste, three bags", description: "Three bags of leaves and branches by the gate.", category: "REMOVE_RECYCLE", subCategory: "Garden waste", size: "M", price: 250, slots: ["06-07", "07-08", "08-09"] },
  { title: "Deliver a chair", description: "Dining chair sold online, needs delivering to the buyer.", category: "MOVE_DELIVER", subCategory: "Blocket delivery", size: "M", price: 220, slots: ["23-00", "00-01"] },
  { title: "Buy light bulbs", description: "Six LED bulbs, E27, warm white.", category: "BUY_FOR_ME", subCategory: "Hardware store", size: "S", price: 70, slots: ["asap"] },
  { title: "Old TV recycling", description: "Flat-screen TV, 42 inch, to the recycling station.", category: "REMOVE_RECYCLE", subCategory: "Electronics", size: "L", price: 300, slots: ["01-02", "02-03", "03-04"] },
  { title: "Free bookshelf", description: "Tall bookshelf, free. Needs two people to carry.", category: "GIVE_AWAY", subCategory: "Furniture", size: "L", price: 0, slots: ["21-22", "23-00", "07-08"] },
  { title: "Move a bicycle", description: "Adult bike from the cellar to a flat nearby.", category: "MOVE_DELIVER", subCategory: "Small moves", size: "M", price: 180, slots: ["22-23", "23-00"] },
  { title: "Grocery run", description: "Milk, bread and vegetables, list provided.", category: "BUY_FOR_ME", subCategory: "Grocery run", size: "M", price: 140, slots: ["anytime"] },
  { title: "Pick up a rug", description: "Rug left at a friend's place, needs collecting.", category: "MOVE_DELIVER", subCategory: "Pick up lost items", size: "M", price: 160, slots: ["00-01", "01-02"] },
  { title: "Free toys", description: "Box of children's toys, free to a good home.", category: "GIVE_AWAY", subCategory: "Other items", size: "S", price: 0, slots: ["21-22", "22-23", "23-00", "00-01"] },
];

const STREETS = ["Storgatan", "Råsundavägen", "Solnavägen", "Frösundaviks allé", "Bergshamravägen"];
const POSTCODES = ["171 52 Solna", "169 36 Solna", "171 45 Solna", "169 70 Solna", "170 70 Solna"];

function adData(d: Demo, i: number, posterId: string) {
  const serviceFee = d.price > 0 ? Math.max(19, Math.round(d.price * 0.15)) : 0;
  return {
    title: d.title,
    description: d.description,
    category: d.category,
    subCategory: d.subCategory,
    size: d.size,
    photos: photos(i),
    address: `${STREETS[i % STREETS.length]} ${10 + i * 3}, ${POSTCODES[i % POSTCODES.length]}`,
    latitude: 59.36 + i * 0.0007,
    longitude: 17.99 + i * 0.0009,
    placement: i % 2 === 0 ? "In the home" : "Outside",
    floor: String(i % 4),
    fitsInElevator: i % 3 !== 0,
    canHelpCarry: i % 4 === 0,
    timeSlots: JSON.stringify(d.slots),
    price: d.price,
    serviceFee,
    total: d.price + serviceFee,
    posterId,
  };
}

async function main() {
  const poster = await db.user.upsert({
    where: { id: "helper-erik" },
    update: {},
    create: { id: "helper-erik", name: "Erik", isSelf: false },
  });

  const email = process.env.SEED_BOOKED_FOR?.trim().toLowerCase();
  const booker = email
    ? await db.user.findUnique({ where: { email } })
    : await db.user.findFirst({ where: { email: { not: null } }, orderBy: { createdAt: "asc" } });

  const ids = [
    ...ACTIVE.map((_, i) => `demo-active-${i + 1}`),
    ...BOOKED.map((_, i) => `demo-booked-${i + 1}`),
  ];
  await db.ad.deleteMany({ where: { id: { in: ids } } });

  for (const [i, d] of ACTIVE.entries()) {
    await db.ad.create({
      data: { id: `demo-active-${i + 1}`, ...adData(d, i, poster.id), status: "ACTIVE" },
    });
  }
  console.log(`Added ${ACTIVE.length} active demo ads.`);

  if (!booker) {
    console.log("No account found to book the other 10 for. Sign up first, or set SEED_BOOKED_FOR.");
    return;
  }
  for (const [i, d] of BOOKED.entries()) {
    await db.ad.create({
      data: {
        id: `demo-booked-${i + 1}`,
        ...adData(d, i + 3, poster.id),
        status: "CLAIMED",
        claimedById: booker.id,
        claimedAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000),
        claimedSlot: d.slots[i % d.slots.length],
      },
    });
  }
  console.log(`Added ${BOOKED.length} demo ads booked by ${booker.email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
