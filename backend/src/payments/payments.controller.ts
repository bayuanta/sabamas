import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  create(@Body() data: any) {
    return this.paymentsService.create(data);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.paymentsService.findAll(query);
  }

  @Get('undeposited')
  getUndepositedFunds() {
    return this.paymentsService.getUndepositedFunds();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.paymentsService.cancel(id);
  }

  @Get('partial/:customerId')
  getPartialPayments(@Param('customerId') customerId: string) {
    return this.paymentsService.getPartialPayments(customerId);
  }

  @Get('partial/:customerId/:bulanTagihan')
  getPartialPaymentDetail(
    @Param('customerId') customerId: string,
    @Param('bulanTagihan') bulanTagihan: string,
  ) {
    return this.paymentsService.getPartialPaymentDetail(customerId, bulanTagihan);
  }
}
