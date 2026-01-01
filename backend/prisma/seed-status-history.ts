import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCustomerStatusHistory() {
    console.log('🌱 Seeding customer status history...');

    // Get all customers
    const customers = await prisma.customer.findMany({
        select: {
            id: true,
            nama: true,
            status: true,
            tanggal_bergabung: true,
        },
    });

    console.log(`Found ${customers.length} customers`);

    for (const customer of customers) {
        // Check if already has status history
        const existingHistory = await prisma.customerStatusHistory.findFirst({
            where: { customer_id: customer.id },
        });

        if (existingHistory) {
            console.log(`✓ Customer ${customer.nama} already has status history`);
            continue;
        }

        // Create initial status history
        await prisma.customerStatusHistory.create({
            data: {
                customer_id: customer.id,
                status: customer.status,
                tanggal_mulai: customer.tanggal_bergabung,
                tanggal_selesai: null, // Still active
                keterangan: 'Status awal saat bergabung',
            },
        });

        console.log(`✓ Created status history for ${customer.nama}`);
    }

    console.log('✅ Customer status history seeding completed!');
}

seedCustomerStatusHistory()
    .catch((e) => {
        console.error('❌ Error seeding customer status history:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
