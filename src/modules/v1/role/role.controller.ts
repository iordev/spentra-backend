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
import { RoleService } from './role.service';

import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';

@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly rolesService: RoleService) {}

  @Get()
  @RequirePermissions('role:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.rolesService.findAll(query, baseUrl);
    return {
      message: 'Your roles are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  @RequirePermissions('role:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.findOne(id);
    return {
      message: 'Here are the details of the role.',
      data,
    };
  }

  @Post()
  @RequirePermissions('role:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return {
      message: 'Great! Your role is ready to go.',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('role:update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    const { role, updated } = await this.rolesService.update(id, updateRoleDto);
    const message = updated
      ? 'Update complete — your role is current.'
      : "Everything's already up to date!";

    return {
      data: role,
      message,
    };
  }

  @Patch(':id/archive')
  @RequirePermissions('role:archive')
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.archive(id);
    return {
      message: 'Role has been archived successfully.',
      data,
    };
  }
}
