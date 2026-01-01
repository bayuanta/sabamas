-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "tarif_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama_kategori" TEXT NOT NULL,
    "harga_per_bulan" REAL NOT NULL,
    "deskripsi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tarif_histories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "tarif_amount" REAL NOT NULL,
    "bulan_berlaku" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tarif_histories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tarif_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "bulan_berlaku" TEXT NOT NULL,
    "tarif_amount" REAL NOT NULL,
    "catatan" TEXT,
    "created_by_user" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tarif_overrides_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tarif_overrides_created_by_user_fkey" FOREIGN KEY ("created_by_user") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "customer_nama" TEXT NOT NULL,
    "tanggal_bayar" DATETIME NOT NULL,
    "bulan_dibayar" TEXT NOT NULL,
    "jumlah_bayar" REAL NOT NULL,
    "metode_bayar" TEXT NOT NULL DEFAULT 'tunai',
    "catatan" TEXT,
    "is_deposited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "setorans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal_setor" DATETIME NOT NULL,
    "jumlah_setor" REAL NOT NULL,
    "periode_awal" DATETIME NOT NULL,
    "periode_akhir" DATETIME NOT NULL,
    "catatan" TEXT,
    "payment_ids" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'collector',
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "last_login" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "login_key" TEXT NOT NULL,
    "last_access" DATETIME,
    "is_registered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_access_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PaymentDeposits" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PaymentDeposits_A_fkey" FOREIGN KEY ("A") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PaymentDeposits_B_fkey" FOREIGN KEY ("B") REFERENCES "setorans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "customers_wilayah_idx" ON "customers"("wilayah");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_tarif_id_idx" ON "customers"("tarif_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_categories_nama_kategori_key" ON "tarif_categories"("nama_kategori");

-- CreateIndex
CREATE INDEX "tarif_histories_customer_id_idx" ON "tarif_histories"("customer_id");

-- CreateIndex
CREATE INDEX "tarif_histories_bulan_berlaku_idx" ON "tarif_histories"("bulan_berlaku");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_histories_customer_id_bulan_berlaku_key" ON "tarif_histories"("customer_id", "bulan_berlaku");

-- CreateIndex
CREATE INDEX "tarif_overrides_customer_id_idx" ON "tarif_overrides"("customer_id");

-- CreateIndex
CREATE INDEX "tarif_overrides_bulan_berlaku_idx" ON "tarif_overrides"("bulan_berlaku");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_overrides_customer_id_bulan_berlaku_key" ON "tarif_overrides"("customer_id", "bulan_berlaku");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_tanggal_bayar_idx" ON "payments"("tanggal_bayar");

-- CreateIndex
CREATE INDEX "payments_metode_bayar_idx" ON "payments"("metode_bayar");

-- CreateIndex
CREATE INDEX "payments_is_deposited_idx" ON "payments"("is_deposited");

-- CreateIndex
CREATE INDEX "setorans_tanggal_setor_idx" ON "setorans"("tanggal_setor");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_access_customer_id_key" ON "customer_access"("customer_id");

-- CreateIndex
CREATE INDEX "customer_access_customer_id_idx" ON "customer_access"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "_PaymentDeposits_AB_unique" ON "_PaymentDeposits"("A", "B");

-- CreateIndex
CREATE INDEX "_PaymentDeposits_B_index" ON "_PaymentDeposits"("B");
