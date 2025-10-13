import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsMongoId()
  category: string;

  @IsMongoId()
  brand: string;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
}

