import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RosokItemDto {
    @IsNotEmpty()
    @IsString()
    jenis_barang: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    berat: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    harga_per_kg: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    total_harga: number;
}

export class CreateRosokSaleDto {
    @IsOptional()
    @IsString()
    tanggal?: string | Date;

    @IsOptional()
    @IsString()
    pembeli?: string;

    @IsOptional()
    @IsString()
    catatan?: string;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RosokItemDto)
    items: RosokItemDto[];

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    total_harga: number;
}
