import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRosokSaleDto } from './dto/create-rosok-sale.dto';
import { UpdateRosokSaleDto } from './dto/update-rosok-sale.dto';

@Injectable()
export class RosokService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateRosokSaleDto) {
        const { items, ...transactionData } = createDto;

        return this.prisma.rosokTransaction.create({
            data: {
                ...transactionData,
                tanggal: transactionData.tanggal ? new Date(transactionData.tanggal) : new Date(),
                items: {
                    create: items.map(item => ({
                        jenis_barang: item.jenis_barang,
                        berat: item.berat,
                        harga_per_kg: item.harga_per_kg,
                        total_harga: item.total_harga,
                    })),
                },
            },
            include: {
                items: true,
            },
        });
    }

    async findAll() {
        return this.prisma.rosokTransaction.findMany({
            include: {
                items: true,
            },
            orderBy: {
                tanggal: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const sale = await this.prisma.rosokTransaction.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        if (!sale) {
            throw new NotFoundException(`Penjualan Rosok with ID ${id} not found`);
        }

        return sale;
    }

    async update(id: string, updateDto: UpdateRosokSaleDto) {
        const sale = await this.findOne(id);

        const { items, ...transactionData } = updateDto;
        const updateDataParsed: any = { ...transactionData };

        if (updateDto.tanggal) {
            updateDataParsed.tanggal = new Date(updateDto.tanggal);
        }

        // Transactional update
        return this.prisma.$transaction(async (prisma) => {
            // 1. Update Header
            const updatedTransaction = await prisma.rosokTransaction.update({
                where: { id },
                data: updateDataParsed,
            });

            // 2. Handle Items update if provided
            if (items) {
                await prisma.rosokItem.deleteMany({
                    where: { transaction_id: id },
                });

                await prisma.rosokItem.createMany({
                    data: items.map(item => ({
                        transaction_id: id,
                        jenis_barang: item.jenis_barang,
                        berat: item.berat,
                        harga_per_kg: item.harga_per_kg,
                        total_harga: item.total_harga,
                    })),
                });
            }

            return prisma.rosokTransaction.findUnique({
                where: { id },
                include: { items: true },
            });
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Cascade delete should handle items removal
        return this.prisma.rosokTransaction.delete({
            where: { id },
        });
    }
}
