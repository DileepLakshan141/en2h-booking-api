import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BookingStatus } from '../generated/prisma/enums';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async getAllServices() {
    return await this.prisma.service.findMany();
  }

  async getServiceById(id: string) {
    const targetService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!targetService) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }
    return targetService;
  }

  async createService(dto: CreateServiceDto) {
    return await this.prisma.service.create({
      data: dto,
    });
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    await this.getServiceById(id);
    return await this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async deleteService(id: string) {
    const activeBookingsCount = await this.prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (activeBookingsCount > 0) {
      throw new HttpException(
        'Cannot delete a service with pending or confirmed bookings',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
