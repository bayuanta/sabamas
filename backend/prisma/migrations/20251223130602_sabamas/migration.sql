-- AlterTable
ALTER TABLE "payments" ADD COLUMN "month_breakdown" TEXT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN "city" TEXT;
ALTER TABLE "settings" ADD COLUMN "company_name" TEXT DEFAULT 'SABAMAS';
ALTER TABLE "settings" ADD COLUMN "letter_footer" TEXT;
ALTER TABLE "settings" ADD COLUMN "letter_header" TEXT;
ALTER TABLE "settings" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "settings" ADD COLUMN "signature_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "signature_title" TEXT;
ALTER TABLE "settings" ADD COLUMN "website" TEXT;
