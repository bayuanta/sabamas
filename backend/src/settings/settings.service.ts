import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getSettings() {
        let settings = await this.prisma.settings.findFirst();

        if (!settings) {
            // Create default settings if not exists
            settings = await this.prisma.settings.create({
                data: {
                    app_name: 'SABAMAS',
                    app_description: 'Sistem Billing Sampah',
                    logo: null,
                    company_name: 'SABAMAS',
                    address: 'Jl. Contoh No. 123',
                    city: '',
                    postal_code: '',
                    phone: '(021) 12345678',
                    email: 'info@sabamas.com',
                    website: '',
                    letter_header: null,
                    letter_footer: 'Dokumen ini sah tanpa tanda tangan dan stempel',
                    signature_name: null,
                    signature_title: 'Petugas SABAMAS',
                },
            });
        }

        return settings;
    }

    async updateSettings(updateData: any) {
        let settings = await this.prisma.settings.findFirst();

        if (!settings) {
            // Create if not exists
            settings = await this.prisma.settings.create({
                data: {
                    app_name: updateData.app_name || 'SABAMAS',
                    app_description: updateData.app_description || 'Sistem Billing Sampah',
                    logo: updateData.logo || null,
                    company_name: updateData.company_name || 'SABAMAS',
                    address: updateData.address || '',
                    city: updateData.city || '',
                    postal_code: updateData.postal_code || '',
                    phone: updateData.phone || '',
                    email: updateData.email || '',
                    website: updateData.website || '',
                    letter_header: updateData.letter_header || null,
                    letter_footer: updateData.letter_footer || 'Dokumen ini sah tanpa tanda tangan dan stempel',
                    signature_name: updateData.signature_name || null,
                    signature_title: updateData.signature_title || 'Petugas SABAMAS',
                },
            });
        } else {
            // Update existing
            settings = await this.prisma.settings.update({
                where: { id: settings.id },
                data: updateData,
            });
        }

        return settings;
    }
}
