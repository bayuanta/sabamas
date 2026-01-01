import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../prisma.service';
import { TariffCalculatorService } from '../common/services/tariff-calculator.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, TariffCalculatorService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
