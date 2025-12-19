import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsController } from './PointsController';
import { PointsService } from './PointsService';
import {
  PointTransaction,
  PointTransactionSchema,
} from '../schemas/PointTransactionSchema';
import { User, UserSchema } from '../schemas/UserSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: PointTransaction.name, 
        schema: PointTransactionSchema,
        collection: 'pointtransactions' // Chỉ định collection name
      },
      {
        name: User.name,
        schema: UserSchema
      }
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}



