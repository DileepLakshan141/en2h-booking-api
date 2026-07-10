import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('service')
@ApiTags('Service')
@ApiBearerAuth()
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  async getAllServices() {
    return this.serviceService.getAllServices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async getServiceById(@Param('id') id: string) {
    return this.serviceService.getServiceById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  async createService(@Body() dto: CreateServiceDto) {
    return this.serviceService.createService(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.updateService(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  async deleteService(@Param('id') id: string) {
    return this.serviceService.deleteService(id);
  }
}
