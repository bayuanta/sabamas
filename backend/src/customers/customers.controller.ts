import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Get('wilayah/list')
  getWilayahList() {
    return this.customersService.getWilayahList();
  }

  @Post('wilayah')
  createWilayah(@Body('nama') nama: string) {
    return this.customersService.createWilayah(nama);
  }

  @Patch('wilayah/:nama')
  updateWilayah(@Param('nama') oldName: string, @Body('newName') newName: string) {
    return this.customersService.updateWilayah(oldName, newName);
  }

  @Delete('wilayah/:nama')
  deleteWilayah(@Param('nama') nama: string) {
    return this.customersService.deleteWilayah(nama);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(
    @Param('id') id: string,
    @Body('status') status: 'aktif' | 'nonaktif',
    @Body('keterangan') keterangan?: string,
  ) {
    return this.customersService.toggleCustomerStatus(id, status, keterangan);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.customersService.getCustomerStatusHistory(id);
  }
}
