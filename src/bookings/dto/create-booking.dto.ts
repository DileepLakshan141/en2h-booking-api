import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsDateString,
  Matches,
  IsOptional,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: '+94771234567' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: 'b3f1c9a0-1234-4c56-9abc-1234567890ab' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: '2026-07-15', description: 'YYYY-MM-DD' })
  @IsDateString()
  bookingDate!: string;

  @ApiProperty({ example: '14:30', description: 'HH:mm, 24-hour' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in HH:mm 24-hour format',
  })
  bookingTime!: string;

  @ApiProperty({
    required: false,
    example: 'I need to cover few dents of my car',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
