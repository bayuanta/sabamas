/*
  Warnings:

  - Added the required column `nomor_pelanggan` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Step 1: Create new table with nomor_pelanggan
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomor_pelanggan" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "wilayah" TEXT NOT NULL,
    "nomor_telepon" TEXT,
    "tarif_id" TEXT NOT NULL,
    "tanggal_efektif_tarif" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "tanggal_bergabung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_tarif_id_fkey" FOREIGN KEY ("tarif_id") REFERENCES "tarif_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Copy existing data with auto-generated nomor_pelanggan
-- Generate nomor_pelanggan as "PLG" + row number (padded to 4 digits)
INSERT INTO "new_customers" ("id", "nomor_pelanggan", "alamat", "createdAt", "nama", "nomor_telepon", "status", "tanggal_bergabung", "tanggal_efektif_tarif", "tarif_id", "updatedAt", "wilayah")
SELECT 
    "id",
    'PLG' || substr('0000' || ROW_NUMBER() OVER (ORDER BY "createdAt"), -4) as "nomor_pelanggan",
    "alamat",
    "createdAt",
    "nama",
    "nomor_telepon",
    "status",
    "tanggal_bergabung",
    "tanggal_efektif_tarif",
    "tarif_id",
    "updatedAt",
    "wilayah"
FROM "customers";

-- Step 3: Drop old table and rename new table
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";

-- Step 4: Create indexes
CREATE UNIQUE INDEX "customers_nomor_pelanggan_key" ON "customers"("nomor_pelanggan");
CREATE INDEX "customers_wilayah_idx" ON "customers"("wilayah");
CREATE INDEX "customers_status_idx" ON "customers"("status");
CREATE INDEX "customers_tarif_id_idx" ON "customers"("tarif_id");
CREATE INDEX "customers_nomor_pelanggan_idx" ON "customers"("nomor_pelanggan");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
