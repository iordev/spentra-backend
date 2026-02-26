import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionDto } from './dto';
import { PaginationDto } from '../../../common/pagination/dto';
import { BaseUrl } from '../../../common/decorators';

@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.permissionsService.findAll(query, baseUrl);
    return {
      message: 'Your permissions are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.permissionsService.findOne(id);
    return {
      message: 'Here are the details of the permission.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() permissionDto: PermissionDto) {
    const data = await this.permissionsService.create(permissionDto);
    return {
      message: 'Great! Your permission is ready to go.',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() permissionDto: PermissionDto) {
    const { permission, updated } = await this.permissionsService.update(id, permissionDto);
    const message = updated
      ? 'Update complete — your permission is current.'
      : "Everything's already up to date!";

    return {
      data: permission,
      message,
    };
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.permissionsService.archive(id);
    return {
      message: 'Permission archived successfully.',
      data,
    };
  }
}
