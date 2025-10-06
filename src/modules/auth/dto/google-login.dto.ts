import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  givenName?: string;

  @IsString()
  @IsOptional()
  familyName?: string;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsString()
  @IsOptional()
  locale?: string;
}
