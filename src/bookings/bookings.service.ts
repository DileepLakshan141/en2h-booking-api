import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '../generated/prisma/enums';
import { Booking, Prisma } from '../generated/prisma/client';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { BookingQueryDto } from './dto/booking-query.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createBooking(dto: CreateBookingDto) {
    const targetService = await this.prisma.service.findUnique({
      where: {
        id: dto.serviceId,
      },
    });

    if (!targetService)
      throw new HttpException('Not a valid service id', HttpStatus.NOT_FOUND);

    // to ensure past dates cant be used as the booking date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dto.bookingDate);
    if (bookingDate < today) {
      throw new HttpException(
        'bookingDate cannot be in the past',
        HttpStatus.BAD_REQUEST,
      );
    }

    // check for overlapping bookings for the same service on the same day
    const sameDayBookings = await this.prisma.booking.findMany({
      where: {
        serviceId: dto.serviceId,
        bookingDate,
        status: { not: BookingStatus.CANCELLED },
      },
    });

    const newStart = this.toMinutes(dto.bookingTime);
    const newEnd = newStart + targetService.duration;

    const hasOverlap = sameDayBookings.some((existing) => {
      const existingStart = this.toMinutes(existing.bookingTime);
      const existingEnd = existingStart + targetService.duration;
      return newStart < existingEnd && existingStart < newEnd;
    });

    if (hasOverlap) {
      throw new HttpException(
        'This time slot overlaps with an existing booking for this service',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.booking.create({
      data: {
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        serviceId: dto.serviceId,
        bookingDate,
        bookingTime: dto.bookingTime,
        notes: dto.notes,
      },
    });
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async findAll(query: BookingQueryDto): Promise<PaginatedResponse<Booking>> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const whereStatement: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereStatement,
        skip,
        take: limit,
        include: { service: true },
      }),
      this.prisma.booking.count({
        where: whereStatement,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!booking) {
      throw new HttpException(
        `Booking with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new HttpException(
        'Cannot change status of a cancelled booking',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new HttpException(
        'Cannot change status of a completed booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new HttpException(
        'Booking is already cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new HttpException(
        'Cannot cancel a completed booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}
