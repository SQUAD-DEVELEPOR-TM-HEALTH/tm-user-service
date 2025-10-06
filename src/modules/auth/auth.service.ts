import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import * as bcrypt from 'bcrypt';
import { generateOtp } from './utils/otp.utils';
import axios from 'axios';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Helper method to create JWT payload with all user data
  private createJwtPayload(user: any, otp?: string) {
    return {
      sub: user.id,
      id: user.id,
      name: user.name,
      nik: user.nik,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneCode: user.phoneCode,
      tokenFcm: user.tokenFcm,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      otp: Number(otp),
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        nik: registerDto.nik,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this NIK already exists');
    }

    const otp = generateOtp();
    console.log(otp, "<<<<<<<<<<<<<<<<");

    const emailMessage = `
     <div style=\"font-family: Arial, sans-serif; background-color: #F4F4F4; color: #333; padding: 20px; line-height: 1.6;\">
             <div style=\"text-align: center; margin-bottom: 20px;\">
                 <img src=\"https://cdc.telkomuniversity.ac.id/storage/images/company/BEg3U1xAI9ZDYZG2M9Hh1tlEh0kX1uXPjEBAhtj4.png\"
                     alt=\"TelkoMedika\" style=\"width: 120px;\">
             </div>
             <div style=\"background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\">
                 <p>Hi <b>${registerDto.name}</b>,</p>
                 <p>Terima kasih telah bergabung dengan <b>TM Health</b>. Gunakan kode OTP berikut untuk menyelesaikan proses registrasi Anda:</p>
                 <div style=\"text-align: center; margin: 20px 0;\">
                     <span style=\"display: inline-block; background: #007BFF; color: #fff; font-size: 24px;
                                 font-weight: bold; padding: 12px 24px; border-radius: 6px; letter-spacing: 3px;\">
                         ${otp}
                     </span>
                 </div>
                 <p style=\"font-size: 14px;\">Jangan berikan kode ini kepada siapapun untuk menjaga keamanan akun Anda.</p>
                 <p style=\"font-size: 14px;\">Email ini dikirim secara otomatis. Harap tidak membalas email ini.</p>
             </div>
             <div style=\"background: #333; color: #fff; padding: 15px; margin-top: 20px; border-radius: 6px; text-align: center;\">
                 <p style=\"font-size: 14px;\"><b>Penting!</b> Jaga kerahasiaan informasi seperti kata sandi dan kode OTP Anda.
                 Jangan berikan kepada pihak yang mengatasnamakan TelkoMedika atau pihak yang tidak terpercaya.</p>
             </div>
         </div>
    `;

    // Send email via TelkoMedika API
    try {
      const emailResponse = await axios.get('https://api.telkomedika.com/mail', {
        params: {
          email: registerDto.email,
          ename: registerDto.name,
          subjek: 'Kode OTP',
          ebody: emailMessage,
        },
      });
      
      console.log('Email sent successfully:', emailResponse);

    if (emailResponse.data.code === 200) {
        // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

     // Create user
    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        nik: registerDto.nik,
        email: registerDto.email,
        dob: new Date(registerDto.dob),
        gender: registerDto.gender,
        agreement: registerDto.agreement || false,
        password: hashedPassword,
        link_photo: registerDto.link_photo,
        phoneNumber: registerDto.phoneNumber,
        phoneCode: registerDto.phoneCode,
        tokenFcm: registerDto.tokenFcm,
      },
    });

    console.log(user);
    const userId = user.id

    const verification = await this.prisma.verification.create({
      data: {
        otp: `${otp}`,
        userId: userId,
      }
    })

    // Generate JWT token with all user data
    const payload = this.createJwtPayload(user);
    const access_token = this.jwtService.sign(payload);

    // Return user without password
    const { password, ...result } = user;
    const { id, name, email, phoneNumber, phoneCode, createdAt, updatedAt, } = result;

    return {
      message: 'User registered successfully',
      access_token,
      otp: Number(otp),
      user: { id, name, email, phoneNumber, phoneCode, createdAt, updatedAt },
    };

      } else {
        return {

        code: 206,
        otp: Number(otp),
        'mail-status': 'Failed to send email',
        };
      }
      
    } catch (error) {
      console.error('Failed to send email:', error.message);
      // Continue with registration even if email fails
      // You can add additional error handling here if needed
      return {
        code: 500,
        message: 'Internal server error',
      }

    }
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { nik: loginDto.nik },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (not a social login user)
    if (!user.password) {
      throw new UnauthorizedException('This account uses social login. Please use Google login.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const otp = generateOtp();
    console.log(otp, "<<<<<<<<<<<<<<<<");

    const emailMessage = `
        <div style=\"font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; line-height: 1.5;\">
            <div style=\"text-align: center; margin-bottom: 20px;\">
                <img src=\"https://cdc.telkomuniversity.ac.id/storage/images/company/BEg3U1xAI9ZDYZG2M9Hh1tlEh0kX1uXPjEBAhtj4.png\" alt=\"First Media\" style=\"width: 100px;\">
            </div>
            <p>Hi <b>${user.name}</b>,</p>
            <p>Terimakasih sudah bergabung di TelkoMedika TM Health. Silakan buka aplikasi TM Health, kemudian masukkan 6 digit kode OTP berikut:</p>
            <div style=\"text-align: center; margin: 20px 0;\">
                <div style=\"display: inline-block; background: #fff; color: #000; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px;\">${otp}</div>
            </div>
            <p style=\"font-size: 14px;\">Demi keamanan data, dimohon untuk tidak memberikan kode kepada siapapun.</p>
            <p style=\"font-size: 14px;\">Email dibuat secara otomatis. Mohon tidak mengirimkan balasan ke email ini.</p>
            <div style=\"background: #333; padding: 15px; margin-top: 20px; border-radius: 4px;\">
                <p style=\"font-size: 14px; color: #fff;\"><b>Perhatian!</b> Kata sandi, kode verifikasi, dan kode OTP bersifat rahasia. Dimohon untuk tidak memberikan data penting Anda kepada pihak yang mengatasnamakan Telkomedika atau yang tidak dapat menjamin keamanannya.</p>
            </div>
        </div>`;
    
    // Send email via TelkoMedika API
    
   try {
    const emailResponse = await axios.get('https://api.telkomedika.com/mail', {
      params: {
        email: user.email,
        ename: user.name,
        subjek: 'Kode OTP',
        ebody: emailMessage,
      },
    });
    
    console.log('Email sent successfully:', emailResponse);

  if (emailResponse.data.code === 200) {
      // Invalidate all previous OTPs for this user
      await this.prisma.verification.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          // You can add fields to mark them as used/expired if needed
          otp: `${otp}`,
        },
      });

       // Generate JWT token with all user data and OTP
    const payload = this.createJwtPayload(user, String(otp));
    const access_token = this.jwtService.sign(payload);

    // Return user without password
    const { password, ...result } = user;

    const { id, name, email, phoneNumber, phoneCode, createdAt, updatedAt, } = result;

    return {
      message: 'Login successful',
      access_token,
      otp: Number(otp), // Add OTP to response
      user: { id, name, email, phoneNumber, phoneCode, createdAt, updatedAt},
    };
  } else {
    return {
      code: 206,
      otp: Number(otp),
      'mail-status': 'Failed to send email',
    };
  }
   } catch (error) {
     console.error('Failed to send email:', error.message);
     return {
       code: 500,
       message: 'Internal server error',
     };
   }

  }

  async sendOtp(email: string) {
    // Cari user
    const user = await this.prisma.user.findFirst({
      where: { email: email },
    });
    
    if (!user) {
      throw new NotFoundException({
        code: 404,
        message: 'Email credentials are wrong. Please try again!',
      });
    }

    // Generate OTP
    const otp = generateOtp();
    console.log(otp, "<<<<<<<<<<<<<<<<");

    // HTML body untuk email
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://cdc.telkomuniversity.ac.id/storage/images/company/BEg3U1xAI9ZDYZG2M9Hh1tlEh0kX1uXPjEBAhtj4.png" alt="First Media" style="width: 100px;">
        </div>
        <p>Hi <b>${email}</b>,</p>
        <p>Terimakasih sudah bergabung di TelkoMedika TM Health. Silakan buka aplikasi TM Health, kemudian masukkan 6 digit kode OTP berikut:</p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background: #fff; color: #000; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px;">${otp}</div>
        </div>
        <p style="font-size: 14px;">Demi keamanan data, dimohon untuk tidak memberikan kode kepada siapapun.</p>
        <p style="font-size: 14px;">Email dibuat secara otomatis. Mohon tidak mengirimkan balasan ke email ini.</p>
        <div style="background: #333; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="font-size: 14px; color: #fff;"><b>Perhatian!</b> Kata sandi, kode verifikasi, dan kode OTP bersifat rahasia. Dimohon untuk tidak memberikan data penting Anda kepada pihak yang mengatasnamakan Telkomedika atau yang tidak dapat menjamin keamanannya.</p>
        </div>
      </div>`;

    try {
      // Hit API eksternal
      const response = await axios.get('https://api.telkomedika.com/mail', {
        params: {
          email: email,
          ename: user.name,
          subjek: 'Kode OTP',
          ebody: emailMessage,
        },
      });

      if (response.data.code === 200) {
        // Update OTP di database
        await this.prisma.verification.updateMany({
          where: { userId: user.id },
          data: { otp: `${otp}` },
        });

        return {
          code: 200,
          name: user.name,
          email: user.email,
          otp,
          'mail-status': 'Email Sent',
        };
      } else {
        return {
          code: 206,
          name: user.name,
          email: user.email,
          otp,
          'mail-status': 'Failed to send email',
        };
      }
    } catch (error) {
      throw new InternalServerErrorException({
        code: 500,
        message: 'Error occurred while sending email',
        error: error.message,
      });
    }
  }


  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  // Generate a 6-digit OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: requestOtpDto.email },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Generate OTP
    const otp = this.generateOtp();

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Invalidate all previous OTPs for this user
    await this.prisma.verification.updateMany({
      where: {
        userId: user.id,

      },
      data: {

      },
    });

    // Create new verification record
    await this.prisma.verification.create({
      data: {
        otp,
        userId: user.id,

      },
    });

    // TODO: In production, send OTP via email/SMS
    // For testing, we'll return it in the response
    return {
      message: 'OTP has been sent to your email',
      // Remove this in production!
      otp_for_testing: otp,
      email: requestOtpDto.email,
      expires_in: '5 minutes',
    };
  }



  async googleLogin(googleLoginDto: GoogleLoginDto) {
    // Check if user exists by Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleLoginDto.googleId },
    });

    // If user doesn't exist by Google ID, check by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: googleLoginDto.email },
      });

      // If user exists with email but no Google ID, link the Google account
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleLoginDto.googleId,
            authProvider: 'google',
            link_photo: googleLoginDto.picture || user.link_photo,
            name: googleLoginDto.name || user.name,
          },
        });
      }
    }

    // If user still doesn't exist, create a new one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: googleLoginDto.googleId,
          email: googleLoginDto.email,
          name: googleLoginDto.name,
          link_photo: googleLoginDto.picture,
          authProvider: 'google',
          agreement: true, // Auto-agree for social login
          // Optional fields set to null/default
          password: null,
          nik: null,
          dob: null,
          gender: null,
          phoneNumber: null,
          phoneCode: null,
          tokenFcm: null,
        },
      });
    } else {
      // Update last login info
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          link_photo: googleLoginDto.picture || user.link_photo,
          name: googleLoginDto.name || user.name,
        },
      });
    }

    // Generate JWT token with all user data
    const payload = this.createJwtPayload(user);
    const access_token = this.jwtService.sign(payload);

    // Return user without password
    const { password, ...result } = user;

    return {
      message: 'Google login successful',
      access_token,
      user: result,
      isNewUser: !user.nik, // If NIK is null, it's likely a new social user
    };
  }
}
