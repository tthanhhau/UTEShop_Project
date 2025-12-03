import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ReviewController } from './ReviewController';
import { ReviewService } from './ReviewService';
import { Review, ReviewSchema } from '../schemas/ReviewSchema';
import { User, UserSchema } from '../schemas/UserSchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';
import { Order, OrderSchema } from '../schemas/OrderSchema';
import { Brand, BrandSchema } from '../schemas/BrandSchema';
import { Category, CategorySchema } from '../schemas/CategorySchema';

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
            { name: Review.name, schema: ReviewSchema },
            { name: User.name, schema: UserSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Brand.name, schema: BrandSchema },
            { name: Category.name, schema: CategorySchema },
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