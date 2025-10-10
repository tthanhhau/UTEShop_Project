import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './AppController';
import { AppService } from './AppService';
import { BrandModule } from './BRAND/BrandModule';
import { CategoryModule } from './CATEGORY/CategoryModule';
import { ProductModule } from './PRODUCT/ProductModule';
import { AnalyticsModule } from './ANALYTICS/AnalyticsModule';
import { AuthModule } from './AUTH/AuthModule';
import { OrderModule } from './ORDER/OrderModule';
import { CustomerModule } from './CUSTOMER/CustomerModule';
import { VoucherModule } from './VOUCHER/VoucherModule';
import { PointsModule } from './POINTS/PointsModule';

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
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/fashion_store',
        directConnection: true,
        family: 4, // Force IPv4
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
