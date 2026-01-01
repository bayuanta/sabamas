import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  nomor_pelanggan: string;

  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsString()
  @IsNotEmpty()
  alamat: string;

  @IsString()
  @IsNotEmpty()
  wilayah: string;

  @IsString()
  @IsOptional()
  nomor_telepon?: string;

  @IsString()
  @IsNotEmpty()
  tarif_id: string;

  @IsDateString()
  @IsOptional()
  tanggal_efektif_tarif?: string;

  @IsString()
  @IsOptional()
  @IsIn(['aktif', 'nonaktif'])
  status?: string;

  @IsDateString()
  @IsOptional()
  tanggal_bergabung?: string;
}
