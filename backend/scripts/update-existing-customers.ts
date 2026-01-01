import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingCustomers() {
    try {
        console.log('🔍 Mengupdate data pelanggan existing...');

        // Ambil semua customer
        const customers = await prisma.customer.findMany({
            include: {
                customerAccess: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log(`📊 Total customer: ${customers.length}`);

        // Update customers yang belum punya CustomerAccess
        let accessCreated = 0;
        for (const customer of customers) {
            if (!customer.customerAccess) {
                await prisma.customerAccess.create({
                    data: {
                        customer_id: customer.id,
                        login_key: '1234', // Default PIN
                        is_registered: false,
                    },
                });
                accessCreated++;
                console.log(
                    `✅ [${accessCreated}] Akses dibuat untuk: ${customer.nama} (${customer.nomor_pelanggan})`
                );
            }
        }

        if (accessCreated === 0) {
            console.log('✅ Semua customer sudah memiliki akses portal!');
        } else {
            console.log(`\n🎉 Selesai! ${accessCreated} akses portal berhasil dibuat.`);
        }

        console.log('\n📋 Daftar Customer dan Nomor Pelanggan:');
        console.log('─'.repeat(60));
        for (const customer of customers) {
            console.log(
                `${customer.nomor_pelanggan.padEnd(10)} | ${customer.nama.padEnd(30)} | PIN: 1234`
            );
        }
        console.log('─'.repeat(60));
        console.log('\n💡 Customer dapat login menggunakan Nomor Pelanggan dan PIN: 1234');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingCustomers();
