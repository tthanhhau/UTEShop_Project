import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../auth/AuthController';
import { AuthService } from '../auth/AuthService';
import { JwtStrategy } from '../auth/strategies/JwtStrategy';
import { User, UserSchema } from '../schemas/UserSchema';
import { ForgotPasswordDto } from '../auth/dto/ForgotPasswordDto';
import { ResetPasswordDto } from '../auth/dto/ResetPasswordDto';
import { MailerModule } from '../config/mailer.module';
import { MailerService } from '../services/mailer.service';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailerService],
  exports: [AuthService],
})
export class AuthModule { }
