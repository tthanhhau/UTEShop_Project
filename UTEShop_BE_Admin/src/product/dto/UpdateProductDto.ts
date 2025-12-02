import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsMongoId()
  brand?: string;
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsArray()
  sizes?: Array<{ size: string; stock: number }>;
}
