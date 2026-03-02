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
import { RolesService } from './roles.service';

import { PaginationDto } from '../../../common/pagination/dto';
import { BaseUrl } from '../../../common/decorators';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.rolesService.findAll(query, baseUrl);
    return {
      message: 'Your roles are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.findOne(id);
    return {
      message: 'Here are the details of the role.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return {
      message: 'Great! Your role is ready to go.',
      data,
    };
  }

  @Patch(':id')
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
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.archive(id);
    return {
      message: 'Role has been archived successfully.',
      data,
    };
  }
}
