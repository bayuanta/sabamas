import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCustomerAccess() {
    try {
        console.log('🔍 Mencari customer tanpa akses portal...');

        // Ambil semua customer
        const customers = await prisma.customer.findMany({
            include: {
                customerAccess: true,
            },
        });

        console.log(`📊 Total customer: ${customers.length}`);

        // Filter customer yang belum punya access
        const customersWithoutAccess = customers.filter(
            (customer) => !customer.customerAccess
        );

        console.log(
            `⚠️  Customer tanpa akses: ${customersWithoutAccess.length}`
        );

        if (customersWithoutAccess.length === 0) {
            console.log('✅ Semua customer sudah memiliki akses portal!');
            return;
        }

        // Buat customer access untuk setiap customer
        let created = 0;
        for (const customer of customersWithoutAccess) {
            await prisma.customerAccess.create({
                data: {
                    customer_id: customer.id,
                    login_key: '1234', // Default PIN
                    is_registered: false,
                },
            });
            created++;
            console.log(
                `✅ [${created}/${customersWithoutAccess.length}] Akses dibuat untuk: ${customer.nama}`
            );
        }

        console.log(`\n🎉 Selesai! ${created} akses portal berhasil dibuat.`);
        console.log('\n📝 Info Login:');
        console.log('   - Nomor Pelanggan: [sesuai data customer]');
        console.log('   - PIN: 1234');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createCustomerAccess();
