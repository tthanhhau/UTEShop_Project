import { AuthService } from './AuthService';
import { LoginDto } from './DTO/LoginDto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        data: {
            token: string;
            user: {
                id: unknown;
                name: string;
                email: string;
                role: string;
            };
        };
    }>;
    getProfile(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
}
