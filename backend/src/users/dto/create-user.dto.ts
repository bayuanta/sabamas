import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['admin', 'collector', 'finance'])
  role: string;

  @IsString()
  @IsOptional()
  @IsIn(['aktif', 'nonaktif'])
  status?: string = 'aktif';
}
