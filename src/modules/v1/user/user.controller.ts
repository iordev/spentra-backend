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
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { BaseUrl } from '../../../common';
import { PaginationDto } from 'src/common';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.usersService.findAll(query, baseUrl);
    return {
      message: 'Your users are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return {
      message: 'Here are the details of the user.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      message: 'Great! Your user is ready to go.',
      data,
    };
  }
  @Patch(':id')
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

  @Patch(':id/archive')
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.archive(id);
    return {
      message: 'User archived successfully.',
      data,
    };
  }
}
