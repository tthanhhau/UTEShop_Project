import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('🚀 Starting Admin Backend bootstrap...');

  try {
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');

    // Enable CORS
    app.enableCors({
      // origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'],
      origin: true,
      credentials: true,
    });
    console.log('✅ CORS enabled');

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

