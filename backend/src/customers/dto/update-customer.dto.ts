import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  nomor_pelanggan?: string;

  @IsString()
  @IsOptional()
  alamat?: string;

  @IsString()
  @IsOptional()
  wilayah?: string;

  @IsString()
  @IsOptional()
  nomor_telepon?: string;

  @IsString()
  @IsOptional()
  tarif_id?: string;

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
