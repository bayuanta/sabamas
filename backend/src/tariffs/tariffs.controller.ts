import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { BulkUpdateTariffDto } from './dto/bulk-update-tariff.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('tariffs')
@UseGuards(JwtAuthGuard)
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) { }

  @Post('categories')
  createCategory(@Body() data: { nama_kategori: string; harga_per_bulan: number; deskripsi?: string }) {
    return this.tariffsService.createCategory(data);
  }

  @Get('categories')
  findAllCategories() {
    return this.tariffsService.findAllCategories();
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.tariffsService.findOneCategory(id);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: any) {
    return this.tariffsService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.tariffsService.removeCategory(id);
  }

  @Post('overrides')
  createOverride(@Body() data: any) {
    return this.tariffsService.createOverride(data);
  }

  @Get('overrides/customer/:customerId')
  findOverridesByCustomer(@Param('customerId') customerId: string) {
    return this.tariffsService.findOverridesByCustomer(customerId);
  }

  @Delete('overrides/:id')
  removeOverride(@Param('id') id: string) {
    return this.tariffsService.removeOverride(id);
  }

  @Post('bulk-update')
  bulkUpdateCustomerTariff(@Body() data: BulkUpdateTariffDto) {
    return this.tariffsService.bulkUpdateCustomerTariff({
      ...data,
      tanggal_efektif: new Date(data.tanggal_efektif),
    });
  }
}
