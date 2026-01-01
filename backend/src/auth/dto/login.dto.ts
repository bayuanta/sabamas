import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class CustomerLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // customer_id or nomor_telepon

  @IsString()
  @IsNotEmpty()
  login_key: string;
}

export class LoginResponse {
  access_token: string;
  user: {
    id: string;
    nama: string;
    email?: string;
    role?: string;
    nomor_pelanggan?: string;
    type: 'admin' | 'customer';
  };
}
