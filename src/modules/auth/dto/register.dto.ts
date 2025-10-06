import { IsString, IsEmail, IsNotEmpty, MinLength, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nik: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsBoolean()
  @IsOptional()
  agreement?: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  link_photo?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  phoneCode: string;

  @IsString()
  @IsOptional()
  tokenFcm?: string;
}
