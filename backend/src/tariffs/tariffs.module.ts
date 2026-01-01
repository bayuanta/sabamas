import { Module } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TariffsController],
  providers: [TariffsService, PrismaService],
  exports: [TariffsService],
})
export class TariffsModule {}
