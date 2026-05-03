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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { BaseUrl, RequirePermissions } from '../../../common';
import { PaginationDto } from 'src/common';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';
import * as express from 'express';
import { User } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get()
  @RequirePermissions('user:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.usersService.findAll(query, baseUrl);
    return {
      message: 'Your users are now displayed.',
      ...data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('user:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return {
      message: 'Here are the details of the user.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('user:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      message: 'Great! Your user is ready to go.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard)
  @Patch('onboard')
  @HttpCode(HttpStatus.OK)
  async onboard(@Req() req: express.Request) {
    const user = req.user as { id: number; email: string };
    await this.usersService.completeOnboarding(user.id);
    return { message: 'Onboarding complete.' };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('user:update')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    const { user, updated } = await this.usersService.update(id, updateUserDto);
    const message = updated
      ? 'Update complete — your profile is current.'
      : "Everything's already up to date!";

    return {
      data: user,
      message,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id/archive')
  @RequirePermissions('user:archive')
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.archive(id);
    return {
      message: 'User archived successfully.',
      data,
    };
  }
}
