-- CreateTable
CREATE TABLE "customer_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tanggal_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" DATETIME,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_status_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "customer_status_history_customer_id_idx" ON "customer_status_history"("customer_id");

-- CreateIndex
CREATE INDEX "customer_status_history_tanggal_mulai_idx" ON "customer_status_history"("tanggal_mulai");
