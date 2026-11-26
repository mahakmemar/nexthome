-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "size" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "placement" TEXT,
    "floor" TEXT,
    "doorCode" TEXT,
    "fitsInElevator" BOOLEAN NOT NULL DEFAULT false,
    "canHelpCarry" BOOLEAN NOT NULL DEFAULT false,
    "timeSlots" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "serviceFee" REAL NOT NULL,
    "total" REAL NOT NULL,
    "posterId" TEXT NOT NULL,
    "claimedById" TEXT,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ad_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ad_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
