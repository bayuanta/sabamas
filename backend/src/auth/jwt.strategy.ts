import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'admin' | 'customer';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'admin') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'aktif') {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'admin',
      };
    } else if (payload.type === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });

      if (!customer || customer.status !== 'aktif') {
        throw new UnauthorizedException('Customer not found or inactive');
      }

      return {
        userId: customer.id,
        email: payload.email,
        type: 'customer',
      };
    }

    throw new UnauthorizedException('Invalid token type');
  }
}
