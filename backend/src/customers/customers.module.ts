import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaService } from '../prisma.service';
import { TariffCalculatorService } from '../common/services/tariff-calculator.service';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';

@Module({
  controllers: [CustomersController],
  providers: [
    CustomersService,
    PrismaService,
    TariffCalculatorService,
    ArrearsCalculatorService,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
