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
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';

@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionsService: PermissionService) {}

  @Get()
  @RequirePermissions('permission:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.permissionsService.findAll(query, baseUrl);
    return {
      message: 'Your permissions are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  @RequirePermissions('permission:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.permissionsService.findOne(id);
    return {
      message: 'Here are the details of the permission.',
      data,
    };
  }

  @Post()
  @RequirePermissions('permission:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const data = await this.permissionsService.create(createPermissionDto);
    return {
      message: 'Great! Your permission is ready to go.',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('permission:update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const { permission, updated } = await this.permissionsService.update(id, updatePermissionDto);
    const message = updated
      ? 'Update complete — your permission is current.'
      : "Everything's already up to date!";
    return {
      data: permission,
      message,
    };
  }

  @Patch(':id/archive')
  @RequirePermissions('permission:archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.permissionsService.archive(id);
    return {
      message: 'Permission archived successfully.',
      data,
    };
  }
}
