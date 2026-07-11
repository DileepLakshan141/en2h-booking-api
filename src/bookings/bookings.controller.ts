import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a booking (no auth required)' })
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all bookings (with pagination)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.bookingsService.findAll(pagination);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
