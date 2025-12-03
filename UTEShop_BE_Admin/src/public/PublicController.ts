import { Controller, Get } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller('public')
export class PublicController {
    constructor(
        private httpService: HttpService
    ) { }

    @Get('test-connection')
    async testConnection() {
        console.log('🔍 [PUBLIC] Testing connection to user backend...');

        try {
            const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
            console.log(`📡 [PUBLIC] Calling user backend at: ${userBackendUrl}/api/internal/test-db`);

            const response = await this.httpService.get(`${userBackendUrl}/api/internal/test-db`).toPromise();
            console.log('✅ [PUBLIC] Successfully connected to user backend');

            return {
                success: true,
                message: 'Connection test successful',
                userBackendResponse: response?.data
            };
        } catch (error) {
            console.error('❌ [PUBLIC] Failed to connect to user backend:', error.message);
            return {
                success: false,
                message: 'Connection test failed',
                error: error.message
            };
        }
    }
}