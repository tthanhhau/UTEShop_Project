import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../SCHEMAS/UserSchema';
import { LoginDto } from './DTO/LoginDto';
export declare class AuthService {
    private userModel;
    private jwtService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService);
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
    validateUser(userId: string): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
}
