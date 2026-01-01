
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findFirst();
    console.log('--- DATABASE RECORD START ---');
    console.log('Logo Path:', settings?.logo);
    console.log('--- DATABASE RECORD END ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
