import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Valid email address required' })
  email!: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}
