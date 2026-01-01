import { Module } from '@nestjs/common';
import { RosokService } from './rosok.service';
import { RosokController } from './rosok.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [RosokController],
    providers: [RosokService, PrismaService],
})
export class RosokModule { }
