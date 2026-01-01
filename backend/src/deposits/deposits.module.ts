import { Module } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DepositsController],
  providers: [DepositsService, PrismaService],
  exports: [DepositsService],
})
export class DepositsModule {}
