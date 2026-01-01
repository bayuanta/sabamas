import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto, CustomerLoginDto, LoginResponse } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { TimezoneUtil } from '../common/utils/timezone.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  /**
   * Admin/Staff login
   */
  async adminLogin(loginDto: AdminLoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'aktif') {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: TimezoneUtil.nowWIB() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        type: 'admin',
      },
    };
  }

  /**
   * Customer portal login
   */
  async customerLogin(loginDto: CustomerLoginDto): Promise<LoginResponse> {
    // Find customer by nomor_pelanggan
    const customer = await this.prisma.customer.findUnique({
      where: {
        nomor_pelanggan: loginDto.identifier,
      },
      include: {
        customerAccess: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (customer.status !== 'aktif') {
      throw new UnauthorizedException('Customer account is inactive');
    }

    if (!customer.customerAccess) {
      throw new UnauthorizedException('Customer access not configured');
    }

    // Verify login key (simple comparison, or could use bcrypt)
    if (customer.customerAccess.login_key !== loginDto.login_key) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last access
    await this.prisma.customerAccess.update({
      where: { id: customer.customerAccess.id },
      data: {
        last_access: TimezoneUtil.nowWIB(),
        is_registered: true,
      },
    });

    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.nomor_pelanggan,
      role: 'customer',
      type: 'customer',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: customer.id,
        nama: customer.nama,
        nomor_pelanggan: customer.nomor_pelanggan,
        type: 'customer',
      },
    };
  }

  /**
   * Hash password for user creation
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
