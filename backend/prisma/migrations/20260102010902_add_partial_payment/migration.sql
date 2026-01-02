-- CreateTable
CREATE TABLE "partial_payments" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bulan_tagihan" TEXT NOT NULL,
    "jumlah_tagihan" DOUBLE PRECISION NOT NULL,
    "jumlah_terbayar" DOUBLE PRECISION NOT NULL,
    "sisa_tagihan" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'cicilan',
    "payment_ids" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partial_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partial_payments_customer_id_idx" ON "partial_payments"("customer_id");

-- CreateIndex
CREATE INDEX "partial_payments_status_idx" ON "partial_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "partial_payments_customer_id_bulan_tagihan_key" ON "partial_payments"("customer_id", "bulan_tagihan");

-- AddForeignKey
ALTER TABLE "partial_payments" ADD CONSTRAINT "partial_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
