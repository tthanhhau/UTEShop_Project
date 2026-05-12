import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('🚀 Starting Admin Backend bootstrap...');

  try {
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');

    // Enable CORS - Allow all origins for development
    app.enableCors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600,
    });
    console.log('✅ CORS enabled for all origins (development mode)');

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

