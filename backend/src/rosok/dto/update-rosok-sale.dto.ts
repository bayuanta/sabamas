import { PartialType } from '@nestjs/mapped-types';
import { CreateRosokSaleDto } from './create-rosok-sale.dto';

export class UpdateRosokSaleDto extends PartialType(CreateRosokSaleDto) { }
