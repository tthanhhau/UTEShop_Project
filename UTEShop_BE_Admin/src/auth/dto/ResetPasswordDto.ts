import { IsString, MinLength, IsEmail } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    otp: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}