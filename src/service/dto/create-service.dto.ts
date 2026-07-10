import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Paint Correction & Polishing' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Professional paint restoration service that removes all the dirt',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsInt()
  @IsPositive()
  duration!: number;

  @ApiProperty({ example: 7500.99, description: 'Price in LKR' })
  @IsPositive()
  price!: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
