import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';

// Modules
import { AuthModule } from './auth/AuthModule';
import { BrandModule } from './brand/BrandModule';
import { CategoryModule } from './category/CategoryModule';
import { ProductModule } from './product/ProductModule';
import { OrderModule } from './order/OrderModule';
import { CustomerModule } from './customer/CustomerModule';
import { VoucherModule } from './voucher/VoucherModule';
import { PointsModule } from './points/PointsModule';
import { AnalyticsModule } from './analytics/AnalyticsModule';
import { ReviewModule } from './review/ReviewModule';
import { PublicModule } from './public/PublicModule';
import { MailerModule } from './config/mailer.module';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') ||
          configService.get<string>('MONGO_URI') ||
          'mongodb://127.0.0.1:27017/shop';
        console.log('🔗 Connecting to MongoDB:', uri);
        return {
          uri,
          directConnection: false,
          family: 4, // Force IPv4
        };
      },
      inject: [ConfigService],
    }),

    // JWT Module
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),

    // HTTP Module for internal API calls
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // Feature Modules
    AuthModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    CustomerModule,
    VoucherModule,
    PointsModule,
    AnalyticsModule,
    ReviewModule,
    PublicModule,
    MailerModule,
  ],
})
export class AppModule { }

