import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Validate that the user still exists in database
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return all user data from the payload
    return {
      userId: payload.sub,
      id: payload.id,
      name: payload.name,
      nik: payload.nik,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      phoneCode: payload.phoneCode,
      tokenFcm: payload.tokenFcm,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      otp: payload.otp , // Include OTP if present
    };
  }
}
