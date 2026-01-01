/*
  Warnings:

  - You are about to drop the `penjualan_rosok` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "penjualan_rosok";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "rosok_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pembeli" TEXT,
    "catatan" TEXT,
    "total_harga" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rosok_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "jenis_barang" TEXT NOT NULL,
    "berat" REAL NOT NULL,
    "harga_per_kg" REAL NOT NULL,
    "total_harga" REAL NOT NULL,
    CONSTRAINT "rosok_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "rosok_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "rosok_items_transaction_id_idx" ON "rosok_items"("transaction_id");
