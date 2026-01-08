import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { PaymentsModule } from './payments/payments.module';
import { DepositsModule } from './deposits/deposits.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { RosokModule } from './rosok/rosok.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    TariffsModule,
    PaymentsModule,
    DepositsModule,
    ReportsModule,
    SettingsModule,
    RosokModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule { } // vps-update-trigger
