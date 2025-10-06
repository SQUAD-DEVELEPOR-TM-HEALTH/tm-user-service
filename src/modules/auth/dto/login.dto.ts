import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  nik: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
