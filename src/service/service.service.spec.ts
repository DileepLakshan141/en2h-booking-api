import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ServiceService } from './service.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../generated/prisma/enums';

describe('ServiceService', () => {
  let service: ServiceService;
  let prisma: {
    service: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    booking: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ServiceService>(ServiceService);

    jest.clearAllMocks();
  });

  describe('getServiceById', () => {
    it('throws Not Found if the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.getServiceById('nonexistent-id'),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('returns the service if it exists', async () => {
      const mockService = {
        id: 'service-1',
        title: 'sample_service_title',
        description: 'sample_service_description',
        duration: 60,
        price: 50.0,
        isActive: true,
      };
      prisma.service.findUnique.mockResolvedValue(mockService);

      const result = await service.getServiceById('service-1');

      expect(result).toEqual(mockService);
    });
  });

  describe('createService', () => {
    it('creates a service with the provided data', async () => {
      const dto = {
        title: 'sample_service_title',
        description: 'sample_service_description',
        duration: 60,
        price: 50.0,
      };
      const created = { id: 'service-1', ...dto, isActive: true };
      prisma.service.create.mockResolvedValue(created);

      const result = await service.createService(dto);

      expect(prisma.service.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('updateService', () => {
    it('throws Not Found if the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.updateService('nonexistent-id', { title: 'New title' }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });

      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it('updates the service if it exists', async () => {
      const existing = { id: 'service-1', title: 'Old title' };
      const updated = { id: 'service-1', title: 'New title' };
      prisma.service.findUnique.mockResolvedValue(existing);
      prisma.service.update.mockResolvedValue(updated);

      const result = await service.updateService('service-1', {
        title: 'New title',
      });

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: { title: 'New title' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteService', () => {
    it('throws Not Found if the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteService('nonexistent-id'),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws Conflict if the service has pending or confirmed bookings', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      prisma.booking.count.mockResolvedValue(2);

      await expect(service.deleteService('service-1')).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });

      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it('checks for PENDING and CONFIRMED bookings specifically when counting', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      prisma.booking.count.mockResolvedValue(0);
      prisma.service.update.mockResolvedValue({
        id: 'service-1',
        isActive: false,
      });

      await service.deleteService('service-1');

      expect(prisma.booking.count).toHaveBeenCalledWith({
        where: {
          serviceId: 'service-1',
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
      });
    });

    it('soft-deletes (isActive: false) when there are no active bookings', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      prisma.booking.count.mockResolvedValue(0);
      prisma.service.update.mockResolvedValue({
        id: 'service-1',
        isActive: false,
      });

      const result = await service.deleteService('service-1');

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('allows deletion when only cancelled/completed bookings exist', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });

      prisma.booking.count.mockResolvedValue(0);
      prisma.service.update.mockResolvedValue({
        id: 'service-1',
        isActive: false,
      });

      await expect(service.deleteService('service-1')).resolves.not.toThrow();
    });
  });
});
