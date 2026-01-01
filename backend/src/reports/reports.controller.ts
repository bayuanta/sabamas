import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('payments')
  getPaymentReport(@Query() query: any) {
    return this.reportsService.getPaymentReport(query);
  }

  @Get('arrears')
  getArrearsReport(@Query() query: any) {
    return this.reportsService.getArrearsReport(query);
  }

  @Get('dashboard')
  getDashboardStats(@Query('year') year?: number, @Query('revenueYear') revenueYear?: number) {
    return this.reportsService.getDashboardStats(year, revenueYear);
  }
}
