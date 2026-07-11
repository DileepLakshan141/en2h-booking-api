import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../generated/prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: {
    service: { findUnique: jest.Mock };
    booking: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      service: { findUnique: jest.fn() },
      booking: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('create', () => {
    const mockService = {
      id: 'service-1',
      title: 'sample_title',
      duration: 60,
    };

    const baseDto = {
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '+94771234567',
      serviceId: 'service-1',
      bookingDate: '2099-01-01',
      bookingTime: '10:00',
    };

    it('throws NotFoundException if service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(baseDto as any)).rejects.toMatchObject(
        {
          status: HttpStatus.NOT_FOUND,
        },
      );
    });

    it('throws BadRequestException if bookingDate is in the past', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);

      const pastDto = { ...baseDto, bookingDate: '2020-01-01' };

      await expect(service.createBooking(pastDto as any)).rejects.toMatchObject(
        {
          status: HttpStatus.BAD_REQUEST,
        },
      );
    });

    it('throws ConflictException when the new booking overlaps an existing one', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findMany.mockResolvedValue([
        {
          bookingTime: '09:30',
          status: BookingStatus.CONFIRMED,
        },
      ]);

      await expect(service.createBooking(baseDto as any)).rejects.toMatchObject(
        {
          status: HttpStatus.CONFLICT,
        },
      );
    });

    it('allows booking when no overlap exists', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findMany.mockResolvedValue([]); // no existing bookings
      prisma.booking.create.mockResolvedValue({ id: 'booking-1', ...baseDto });

      const result = await service.createBooking(baseDto);

      expect(prisma.booking.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'booking-1');
    });

    it('ignores cancelled bookings when checking for overlap', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.create.mockResolvedValue({ id: 'booking-2', ...baseDto });

      await service.createBooking(baseDto);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: BookingStatus.CANCELLED },
          }) as unknown,
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('throws BadRequestException when trying to change status of a CANCELLED booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('throws BadRequestException when trying to change status of a COMPLETED booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.CANCELLED }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('allows a valid status transition', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus('booking-1', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });
});
