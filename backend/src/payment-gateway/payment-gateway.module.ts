import { Module } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentGatewayController } from './payment-gateway.controller';
import { CustomersModule } from '../customers/customers.module';
import { PaymentsModule } from '../payments/payments.module';
import { ArrearsCalculatorService } from '../common/services/arrears-calculator.service';
import { TariffCalculatorService } from '../common/services/tariff-calculator.service';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [CustomersModule, PaymentsModule],
    controllers: [PaymentGatewayController],
    providers: [
        PaymentGatewayService,
        ArrearsCalculatorService,
        TariffCalculatorService,
        PrismaService
    ],
    exports: [PaymentGatewayService],
})
export class PaymentGatewayModule { }
