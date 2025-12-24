import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnController } from './return.controller';
import { ReturnService } from './return.service';
import { ReturnRequest, ReturnRequestSchema } from './return.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ReturnRequest.name, schema: ReturnRequestSchema },
        ]),
    ],
    controllers: [ReturnController],
    providers: [ReturnService],
    exports: [ReturnService],
})
export class ReturnModule { }
