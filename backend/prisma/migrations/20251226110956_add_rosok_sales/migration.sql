-- CreateTable
CREATE TABLE "penjualan_rosok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jenis_barang" TEXT NOT NULL,
    "berat" REAL NOT NULL,
    "harga_per_kg" REAL NOT NULL,
    "total_harga" REAL NOT NULL,
    "pembeli" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
