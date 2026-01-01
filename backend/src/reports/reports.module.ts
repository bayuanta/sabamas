import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma.service';
import { TariffCalculatorService } from '../common/services/tariff-calculator.service';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PrismaService,
    TariffCalculatorService,
    ArrearsCalculatorService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
