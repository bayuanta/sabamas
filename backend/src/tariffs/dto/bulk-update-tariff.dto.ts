import { IsArray, IsDateString, IsString, IsNotEmpty } from 'class-validator';

export class BulkUpdateTariffDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    customer_ids: string[];

    @IsString()
    @IsNotEmpty()
    tarif_id: string;

    @IsDateString()
    @IsNotEmpty()
    tanggal_efektif: string;
}
