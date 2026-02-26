import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
    // const data = await this.rolesService.findAll(query, baseUrl);
    // return {
    //   message: 'Your permissions are now displayed.',
    //   ...data,
    // };

    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
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
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Patch(':id')
  archive(@Param('id') id: string) {
    return this.rolesService.archive(+id);
  }
}
