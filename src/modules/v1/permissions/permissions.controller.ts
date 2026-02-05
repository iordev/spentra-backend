import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionDto } from './dto';

@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() permissionDto: PermissionDto) {
    return this.permissionsService.create(permissionDto);
  }
}
