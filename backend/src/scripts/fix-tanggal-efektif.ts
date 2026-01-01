import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to fix tanggal_efektif_tarif for existing customers
 * Sets tanggal_efektif_tarif = tanggal_bergabung if tanggal_efektif_tarif is later
 * This ensures arrears calculation includes all months from join date
 */
async function fixTanggalEfektif() {
  console.log('Starting to fix tanggal_efektif_tarif for existing customers...');

  // Get all customers
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      nama: true,
      tanggal_bergabung: true,
      tanggal_efektif_tarif: true,
    },
  });

  console.log(`Found ${customers.length} customers`);

  let updatedCount = 0;

  for (const customer of customers) {
    const bergabung = new Date(customer.tanggal_bergabung);
    const efektif = new Date(customer.tanggal_efektif_tarif);

    // If tanggal_efektif_tarif is later than tanggal_bergabung, fix it
    if (efektif > bergabung) {
      console.log(`Fixing customer: ${customer.nama}`);
      console.log(`  - Old tanggal_efektif_tarif: ${efektif.toISOString()}`);
      console.log(`  - New tanggal_efektif_tarif: ${bergabung.toISOString()}`);

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          tanggal_efektif_tarif: bergabung,
        },
      });

      updatedCount++;
    }
  }

  console.log(`\nFixed ${updatedCount} customers`);
  console.log('Done!');
}

fixTanggalEfektif()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
