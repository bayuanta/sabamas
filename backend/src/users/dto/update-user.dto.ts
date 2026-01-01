import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nama?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'collector', 'finance'])
  role?: string;

  @IsString()
  @IsOptional()
  @IsIn(['aktif', 'nonaktif'])
  status?: string;
}
