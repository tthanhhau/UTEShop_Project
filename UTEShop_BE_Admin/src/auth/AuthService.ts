import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/UserSchema';
import { LoginDto } from '../auth/dto/LoginDto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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
}
