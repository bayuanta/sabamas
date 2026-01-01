import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 0. Clean database
  console.log('Cleaning database...');
  await prisma.setoran.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tarifOverride.deleteMany();
  await prisma.tarifHistory.deleteMany();
  await prisma.customerAccess.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tarifCategory.deleteMany();

  // 1. Create Tariff Categories
  console.log('Creating tariff categories...');
  const tarifCategories = await Promise.all([
    prisma.tarifCategory.create({
      data: {
        nama_kategori: 'Rumah Tangga',
        harga_per_bulan: 15000,
        deskripsi: 'Tarif untuk rumah tangga biasa',
      },
    }),
    prisma.tarifCategory.create({
      data: {
        nama_kategori: 'Toko/Warung',
        harga_per_bulan: 25000,
        deskripsi: 'Tarif untuk toko atau warung',
      },
    }),
    prisma.tarifCategory.create({
      data: {
        nama_kategori: 'Rumah Makan',
        harga_per_bulan: 40000,
        deskripsi: 'Tarif untuk rumah makan',
      },
    }),
    prisma.tarifCategory.create({
      data: {
        nama_kategori: 'Perkantoran',
        harga_per_bulan: 50000,
        deskripsi: 'Tarif untuk kantor',
      },
    }),
  ]);

  // 2. Create Admin Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      nama: 'Administrator',
      email: 'admin@sabamas.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  });

  await prisma.user.create({
    data: {
      nama: 'Collector 1',
      email: 'collector@sabamas.com',
      password_hash: await bcrypt.hash('collector123', 10),
      role: 'collector',
    },
  });

  // 3. Create Customers
  console.log('Creating customers...');
  const wilayahs = ['RT 01', 'RT 02', 'RT 03', 'RT 04'];
  const customers = [];

  const customerData = [
    { nama: 'Budi Santoso', alamat: 'Jl. Mawar No. 12', wilayah: 'RT 01', nomor_telepon: '081234567890', tarif: tarifCategories[0] },
    { nama: 'Siti Aminah', alamat: 'Jl. Melati No. 5', wilayah: 'RT 01', nomor_telepon: '081234567891', tarif: tarifCategories[0] },
    { nama: 'Ahmad Yani', alamat: 'Jl. Dahlia No. 8', wilayah: 'RT 01', nomor_telepon: '081234567892', tarif: tarifCategories[0] },
    { nama: 'Toko Berkah', alamat: 'Jl. Raya No. 45', wilayah: 'RT 02', nomor_telepon: '081234567893', tarif: tarifCategories[1] },
    { nama: 'Warung Maju', alamat: 'Jl. Pasar No. 12', wilayah: 'RT 02', nomor_telepon: '081234567894', tarif: tarifCategories[1] },
    { nama: 'Dewi Lestari', alamat: 'Jl. Anggrek No. 23', wilayah: 'RT 02', nomor_telepon: '081234567895', tarif: tarifCategories[0] },
    { nama: 'RM Padang Sederhana', alamat: 'Jl. Sudirman No. 67', wilayah: 'RT 03', nomor_telepon: '081234567896', tarif: tarifCategories[2] },
    { nama: 'Hendra Wijaya', alamat: 'Jl. Kenanga No. 34', wilayah: 'RT 03', nomor_telepon: '081234567897', tarif: tarifCategories[0] },
    { nama: 'Kantor Notaris', alamat: 'Jl. Proklamasi No. 89', wilayah: 'RT 04', nomor_telepon: '081234567898', tarif: tarifCategories[3] },
    { nama: 'Rina Fitriani', alamat: 'Jl. Cempaka No. 15', wilayah: 'RT 04', nomor_telepon: '081234567899', tarif: tarifCategories[0] },
  ];

  for (const data of customerData) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const customer = await prisma.customer.create({
      data: {
        nama: data.nama,
        alamat: data.alamat,
        wilayah: data.wilayah,
        nomor_telepon: data.nomor_telepon,
        nomor_pelanggan: `PLG${String(customerData.indexOf(data) + 1).padStart(4, '0')}`,
        tarif_id: data.tarif.id,
        tanggal_bergabung: threeMonthsAgo,
        status: 'aktif',
      },
    });

    customers.push(customer);

    // Create customer access for portal
    await prisma.customerAccess.create({
      data: {
        customer_id: customer.id,
        login_key: '1234', // Simple PIN for demo
      },
    });
  }

  // 4. Create some Tariff Overrides (diskon untuk customer tertentu)
  console.log('Creating tariff overrides...');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  await prisma.tarifOverride.create({
    data: {
      customer_id: customers[0].id,
      bulan_berlaku: currentMonth,
      tarif_amount: 10000,
      catatan: 'Diskon khusus bulan ini',
      created_by_user: adminUser.id,
    },
  });

  // 5. Create Payments
  console.log('Creating payments...');
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const twoMonthsAgoStr = twoMonthsAgo.toISOString().slice(0, 7);

  // Some customers paid for last month
  for (let i = 0; i < 6; i++) {
    const customer = customers[i];
    const tarif = tarifCategories[i < 3 ? 0 : i < 5 ? 1 : 2];

    await prisma.payment.create({
      data: {
        customer_id: customer.id,
        customer_nama: customer.nama,
        tanggal_bayar: lastMonth,
        bulan_dibayar: JSON.stringify([lastMonthStr]),
        jumlah_bayar: tarif.harga_per_bulan,
        metode_bayar: i % 2 === 0 ? 'tunai' : 'transfer',
        catatan: 'Pembayaran rutin',
      },
    });
  }

  // Some customers paid for 2 months ago
  for (let i = 0; i < 4; i++) {
    const customer = customers[i];
    const tarif = tarifCategories[0];

    await prisma.payment.create({
      data: {
        customer_id: customer.id,
        customer_nama: customer.nama,
        tanggal_bayar: twoMonthsAgo,
        bulan_dibayar: JSON.stringify([twoMonthsAgoStr]),
        jumlah_bayar: tarif.harga_per_bulan,
        metode_bayar: 'tunai',
        catatan: 'Pembayaran rutin',
      },
    });
  }

  // Some payments this month
  for (let i = 0; i < 3; i++) {
    const customer = customers[i];
    const tarif = tarifCategories[0];

    await prisma.payment.create({
      data: {
        customer_id: customer.id,
        customer_nama: customer.nama,
        tanggal_bayar: new Date(),
        bulan_dibayar: JSON.stringify([currentMonth]),
        jumlah_bayar: tarif.harga_per_bulan,
        metode_bayar: 'tunai',
        catatan: 'Pembayaran bulan ini',
        is_deposited: false,
      },
    });
  }

  console.log('✅ Seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`- ${tarifCategories.length} tariff categories created`);
  console.log(`- 2 users created (admin@sabamas.com / admin123, collector@sabamas.com / collector123)`);
  console.log(`- ${customers.length} customers created`);
  console.log(`- Payment samples created`);
  console.log(`- Customer access with PIN: 1234 for all customers`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
