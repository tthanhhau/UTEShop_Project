import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PublicController } from './PublicController';

@Module({
    imports: [HttpModule],
    controllers: [PublicController],
})
export class PublicModule {
    constructor() {
        console.log('🔍 PublicModule initialized - Public routes should be available at /api/public');
    }
}