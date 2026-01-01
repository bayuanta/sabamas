import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  create(@Body() data: any) {
    return this.depositsService.create(data);
  }

  @Get()
  findAll() {
    return this.depositsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depositsService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.depositsService.cancel(id);
  }
}
