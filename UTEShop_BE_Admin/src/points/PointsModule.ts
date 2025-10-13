import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsController } from './PointsController';
import { PointsService } from './PointsService';
import {
  PointTransaction,
  PointTransactionSchema,
} from '../schemas/PointTransactionSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: PointTransaction.name, 
        schema: PointTransactionSchema,
        collection: 'pointtransactions' // Chỉ định collection name
      },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}



