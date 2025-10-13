import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

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

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') ||
          configService.get<string>('MONGO_URI') ||
          'mongodb://127.0.0.1:27017/fashion_store';
        console.log('🔗 Connecting to MongoDB:', uri);
        return {
          uri,
          directConnection: true,
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
  ],
})
export class AppModule { }

