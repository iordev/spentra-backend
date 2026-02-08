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
import { GetPermissionDto, PermissionDto } from './dto';

@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPermissions(@Query() query: GetPermissionDto) {
    return this.permissionsService.findAllPermissions(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() permissionDto: PermissionDto) {
    return this.permissionsService.createPermission(permissionDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() permissionDto: PermissionDto) {
    return this.permissionsService.updatePermission(id, permissionDto);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.archivePermission(id);
  }
}
