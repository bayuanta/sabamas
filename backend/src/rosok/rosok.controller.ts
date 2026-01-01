import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RosokService } from './rosok.service';
import { CreateRosokSaleDto } from './dto/create-rosok-sale.dto';
import { UpdateRosokSaleDto } from './dto/update-rosok-sale.dto';

@Controller('rosok')
export class RosokController {
    constructor(private readonly rosokService: RosokService) { }

    @Post()
    create(@Body() createRosokSaleDto: CreateRosokSaleDto) {
        return this.rosokService.create(createRosokSaleDto);
    }

    @Get()
    findAll() {
        return this.rosokService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rosokService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRosokSaleDto: UpdateRosokSaleDto) {
        return this.rosokService.update(id, updateRosokSaleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rosokService.remove(id);
    }
}
