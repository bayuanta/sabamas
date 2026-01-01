-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nomor_pelanggan" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "wilayah" TEXT NOT NULL,
    "nomor_telepon" TEXT,
    "tarif_id" TEXT NOT NULL,
    "tanggal_efektif_tarif" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "tanggal_bergabung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarif_categories" (
    "id" TEXT NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "harga_per_bulan" DOUBLE PRECISION NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarif_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarif_histories" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "tarif_amount" DOUBLE PRECISION NOT NULL,
    "bulan_berlaku" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarif_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarif_overrides" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bulan_berlaku" TEXT NOT NULL,
    "tarif_amount" DOUBLE PRECISION NOT NULL,
    "catatan" TEXT,
    "created_by_user" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarif_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_nama" TEXT NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL,
    "bulan_dibayar" TEXT NOT NULL,
    "jumlah_bayar" DOUBLE PRECISION NOT NULL,
    "diskon_nominal" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,
    "metode_bayar" TEXT NOT NULL DEFAULT 'tunai',
    "catatan" TEXT,
    "month_breakdown" TEXT,
    "is_deposited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setorans" (
    "id" TEXT NOT NULL,
    "tanggal_setor" TIMESTAMP(3) NOT NULL,
    "jumlah_setor" DOUBLE PRECISION NOT NULL,
    "periode_awal" TIMESTAMP(3) NOT NULL,
    "periode_akhir" TIMESTAMP(3) NOT NULL,
    "catatan" TEXT,
    "payment_ids" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setorans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'collector',
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "last_login" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_access" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "login_key" TEXT NOT NULL,
    "last_access" TIMESTAMP(3),
    "is_registered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL DEFAULT 'SABAMAS',
    "app_description" TEXT NOT NULL DEFAULT 'Sistem Billing Sampah',
    "logo" TEXT,
    "company_name" TEXT DEFAULT 'SABAMAS',
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "letter_header" TEXT,
    "letter_footer" TEXT,
    "signature_name" TEXT,
    "signature_title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wilayahs" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wilayahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_status_history" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" TIMESTAMP(3),
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosok_transactions" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pembeli" TEXT,
    "catatan" TEXT,
    "total_harga" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rosok_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosok_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "jenis_barang" TEXT NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "harga_per_kg" DOUBLE PRECISION NOT NULL,
    "total_harga" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "rosok_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_nomor_pelanggan_key" ON "customers"("nomor_pelanggan");

-- CreateIndex
CREATE INDEX "customers_wilayah_idx" ON "customers"("wilayah");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_tarif_id_idx" ON "customers"("tarif_id");

-- CreateIndex
CREATE INDEX "customers_nomor_pelanggan_idx" ON "customers"("nomor_pelanggan");

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
CREATE UNIQUE INDEX "wilayahs_nama_key" ON "wilayahs"("nama");

-- CreateIndex
CREATE INDEX "customer_status_history_customer_id_idx" ON "customer_status_history"("customer_id");

-- CreateIndex
CREATE INDEX "customer_status_history_tanggal_mulai_idx" ON "customer_status_history"("tanggal_mulai");

-- CreateIndex
CREATE INDEX "rosok_items_transaction_id_idx" ON "rosok_items"("transaction_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tarif_id_fkey" FOREIGN KEY ("tarif_id") REFERENCES "tarif_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarif_histories" ADD CONSTRAINT "tarif_histories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarif_overrides" ADD CONSTRAINT "tarif_overrides_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarif_overrides" ADD CONSTRAINT "tarif_overrides_created_by_user_fkey" FOREIGN KEY ("created_by_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_access" ADD CONSTRAINT "customer_access_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_status_history" ADD CONSTRAINT "customer_status_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rosok_items" ADD CONSTRAINT "rosok_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "rosok_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
