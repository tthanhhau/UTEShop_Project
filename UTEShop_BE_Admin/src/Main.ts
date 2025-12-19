import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('🚀 Starting Admin Backend bootstrap...');

  try {
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');

    // Enable CORS with whitelist
    const allowedOrigins = [
      'http://localhost:3000',      // Frontend Admin (Next.js dev)
      'http://localhost:3001',      // Backend Admin (NestJS dev)
      'http://localhost:3002',      // Alternative port
      process.env.FRONTEND_URL,     // Frontend Admin production
      process.env.ADMIN_FRONTEND_URL, // Alternative admin URL
    ].filter(Boolean); // Remove undefined values

    app.enableCors({
      origin: function (origin, callback) {
        // Allow requests with no origin (Postman, curl, mobile apps)
        if (!origin) return callback(null, true);

        // Check if origin is in whitelist
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.warn(`⚠️  CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    console.log('✅ CORS enabled with whitelist:', allowedOrigins);

    // Enable validation
    app.useGlobalPipes(new ValidationPipe());
    console.log('✅ Global validation pipe enabled');

    // Set global prefix
    app.setGlobalPrefix('api');
    console.log('✅ Global prefix set to /api');

    const port = process.env.PORT || 3002;
    await app.listen(port);
    console.log(`🚀 Admin Backend running on: http://localhost:${port}/api`);
    console.log('🔍 Available routes should include: /api/admin/reviews');
  } catch (error) {
    console.error('❌ Error during bootstrap:', error);
    throw error;
  }
}

bootstrap();

