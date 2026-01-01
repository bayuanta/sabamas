
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating logo path in settings...');

    const settings = await prisma.settings.findFirst();

    const newLogoPath = '/uploads/logo/sabamas-logo.png';

    if (settings) {
        await prisma.settings.update({
            where: { id: settings.id },
            data: { logo: newLogoPath },
        });
        console.log(`Updated existing settings. Logo path set to: ${newLogoPath}`);
    } else {
        await prisma.settings.create({
            data: {
                app_name: 'SABAMAS',
                app_description: 'Sistem Billing Sampah',
                logo: newLogoPath,
                company_name: 'SABAMAS',
                // defaults
            }
        });
        console.log(`Created new settings with logo path: ${newLogoPath}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
