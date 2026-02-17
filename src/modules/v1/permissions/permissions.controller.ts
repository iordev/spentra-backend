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
  Req,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionDto } from './dto';
import express from 'express';
import { PaginationDto } from '../../../common/pagination/dto';

@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getAllPermissions(@Query() query: PaginationDto, @Req() request: express.Request) {
    return this.permissionsService.findAllPermissions(query, request);
  }

  @Get(':id')
  getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findPermissionById(id);
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
