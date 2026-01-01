import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto, CustomerLoginDto, LoginResponse } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: AdminLoginDto): Promise<LoginResponse> {
    return this.authService.adminLogin(loginDto);
  }

  @Post('customer-login')
  @HttpCode(HttpStatus.OK)
  async customerLogin(@Body() loginDto: CustomerLoginDto): Promise<LoginResponse> {
    return this.authService.customerLogin(loginDto);
  }
}
