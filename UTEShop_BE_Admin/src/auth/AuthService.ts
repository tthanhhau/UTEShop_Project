import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/UserSchema';
import { LoginDto } from '../auth/dto/LoginDto';
import { ForgotPasswordDto } from '../auth/dto/ForgotPasswordDto';
import { ResetPasswordDto } from '../auth/dto/ResetPasswordDto';
import { ConfigService } from '@nestjs/config';
import { otpHtml } from '../utils/emailTemplates';
import { MailerService } from '../services/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) { }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    console.log('🔐 LOGIN ATTEMPT:', { email, passwordLength: password.length });

    const user = await this.userModel.findOne({ email }).exec();
    console.log('👤 USER FOUND:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ USER NOT FOUND');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    console.log('👤 USER DETAILS:', {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordHash: user.password.substring(0, 20) + '...'
    });

    if (user.role !== 'admin') {
      console.log('❌ ROLE NOT ADMIN:', user.role);
      throw new UnauthorizedException('Bạn không có quyền truy cập');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 PASSWORD VALID:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ PASSWORD INVALID');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    console.log('✅ LOGIN SUCCESS');

    return {
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-password').exec();
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    console.log('🔐 FORGOT PASSWORD REQUEST:', { email });

    const user = await this.userModel.findOne({ email }).exec();
    console.log('👤 USER FOUND:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ USER NOT FOUND');
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (user.role !== 'admin') {
      console.log('❌ ROLE NOT ADMIN:', user.role);
      throw new BadRequestException('Email này không có quyền truy cập admin');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record
    await this.userModel.findByIdAndUpdate(user._id, {
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: otpExpiry,
    });

    console.log('✅ OTP GENERATED:', { email, otp, expiry: otpExpiry });

    try {
      // Send OTP via email
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'UTEShop Admin - Đặt lại mật khẩu',
        html: otpHtml({
          title: 'Đặt lại mật khẩu Admin',
          code: otp
        }),
      });

      console.log('📧 OTP EMAIL SENT:', { email: user.email });

      return {
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
        data: {
          email: user.email,
          expiresIn: 10, // minutes
        },
      };
    } catch (emailError) {
      console.error('❌ FAILED TO SEND EMAIL:', emailError);

      // Fallback: return OTP in response for testing if email fails
      return {
        success: true,
        message: 'Mã OTP đã được tạo (gửi email thất bại, sử dụng OTP này để test)',
        data: {
          email: user.email,
          otp: otp, // Only for testing when email fails
          expiresIn: 10, // minutes
        },
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    console.log('🔐 RESET PASSWORD REQUEST:', { email, otp, passwordLength: newPassword.length });

    const user = await this.userModel.findOne({ email }).exec();
    console.log('👤 USER FOUND:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ USER NOT FOUND');
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (user.role !== 'admin') {
      console.log('❌ ROLE NOT ADMIN:', user.role);
      throw new BadRequestException('Email này không có quyền truy cập admin');
    }

    // Check if OTP is valid and not expired
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      console.log('❌ NO OTP FOUND');
      throw new BadRequestException('Không có yêu cầu đặt lại mật khẩu nào cho email này');
    }

    if (user.resetPasswordOtp !== otp) {
      console.log('❌ INVALID OTP:', { expected: user.resetPasswordOtp, received: otp });
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      console.log('❌ OTP EXPIRED');
      throw new BadRequestException('Mã OTP đã hết hạn');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordOtp: undefined,
      resetPasswordOtpExpiry: undefined,
    });

    console.log('✅ PASSWORD RESET SUCCESS');

    return {
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
    };
  }
}
