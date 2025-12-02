import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './ReviewController';
import { ReviewService } from './ReviewService';
import { Review, ReviewSchema } from '../schemas/ReviewSchema';
import { User, UserSchema } from '../schemas/UserSchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Review.name, schema: ReviewSchema },
            { name: User.name, schema: UserSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {
    constructor() {
        console.log('🔍 ReviewModule initialized - Review routes should be available at /api/admin/reviews');
    }
}