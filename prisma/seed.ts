import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

function photos(seed: string, count: number) {
  return JSON.stringify(
    Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/900/700`),
  );
}

async function main() {
  const self = await db.user.upsert({
    where: { id: "self-user" },
    update: {},
    create: { id: "self-user", name: "You", isSelf: true },
  });

  const helper = await db.user.upsert({
    where: { id: "helper-erik" },
    update: {},
    create: { id: "helper-erik", name: "Erik", isSelf: false },
  });

  await db.ad.deleteMany({ where: { id: { in: ["seed-1", "seed-2", "seed-3", "seed-4"] } } });

  await db.ad.create({
    data: {
      id: "seed-1",
      title: "Trädgårdsavfall",
      description:
        "Hämtning av trädgårdsavfall. En hög på presenningen, den orangea säcken samt en liten hög vid sidan om.",
      category: "REMOVE_RECYCLE",
      subCategory: "Garden waste",
      size: "XL",
      photos: photos("garden", 3),
      status: "ACTIVE",
      address: "Storgatan 12, 171 52 Solna",
      latitude: 59.3616,
      longitude: 17.9989,
      placement: "Outside, in the garden",
      floor: "0",
      fitsInElevator: false,
      canHelpCarry: false,
      timeSlots: JSON.stringify(["asap"]),
      price: 1000,
      serviceFee: 150,
      total: 1150,
      posterId: self.id,
    },
  });

  await db.ad.create({
    data: {
      id: "seed-2",
      title: "Leverans",
      description: "Cykel som ska levereras till en adress i Solna. Cykeln står i garaget.",
      category: "MOVE_DELIVER",
      subCategory: "Small moves",
      size: "M",
      photos: photos("bike", 2),
      status: "ACTIVE",
      address: "Skytteholmsvägen 4, 171 44 Solna",
      latitude: 59.3625,
      longitude: 17.997,
      placement: "In the garage",
      floor: "0",
      fitsInElevator: false,
      canHelpCarry: true,
      timeSlots: JSON.stringify(["anytime"]),
      price: 180,
      serviceFee: 27,
      total: 207,
      posterId: self.id,
    },
  });

  await db.ad.create({
    data: {
      id: "seed-3",
      title: "Flytta möbler",
      description: "En garderob och ett litet bord som behöver flyttas till andra våningen.",
      category: "MOVE_DELIVER",
      subCategory: "Small moves",
      size: "L",
      photos: photos("furniture", 3),
      status: "CLAIMED",
      address: "Huvudstagatan 8, 171 58 Solna",
      latitude: 59.3603,
      longitude: 17.9995,
      placement: "In the home",
      floor: "2",
      fitsInElevator: true,
      canHelpCarry: true,
      timeSlots: JSON.stringify(["asap"]),
      price: 600,
      serviceFee: 90,
      total: 690,
      posterId: self.id,
      claimedById: helper.id,
      claimedAt: new Date(),
    },
  });

  await db.ad.create({
    data: {
      id: "seed-4",
      title: "Pick up teddy bear",
      description: "Big teddy for free, just needs to be picked up from the hallway.",
      category: "GIVE_AWAY",
      subCategory: "Other items",
      size: "S",
      photos: photos("teddy", 1),
      status: "ACTIVE",
      address: "Storgatan 54, 171 52 Solna",
      latitude: 59.3617,
      longitude: 17.999,
      placement: "In the home",
      floor: "2",
      fitsInElevator: true,
      canHelpCarry: false,
      timeSlots: JSON.stringify(["asap"]),
      price: 0,
      serviceFee: 0,
      total: 0,
      posterId: self.id,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
