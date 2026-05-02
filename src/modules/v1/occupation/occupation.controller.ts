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
import { OccupationService } from './occupation.service';
import { CreateOccupationDto, UpdateOccupationDto } from './dto';
import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('occupations')
export class OccupationController {
  constructor(private readonly occupationsService: OccupationService) {}

  @SkipThrottle()
  @Get()
  // @RequirePermissions('occupation:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.occupationsService.findAll(query, baseUrl);
    if (Array.isArray(data)) {
      return {
        message: 'Your occupations are now displayed.',
        data,
      };
    }
    return {
      message: 'Your occupations are now displayed.',
      ...data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('occupation:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.occupationsService.findOne(id);
    return {
      message: 'Here are the details of the occupation.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('occupation:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOccupationDto: CreateOccupationDto) {
    const data = await this.occupationsService.create(createOccupationDto);
    return {
      message: 'Great! Your occupation is ready to go.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('occupation:update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOccupationDto: UpdateOccupationDto,
  ) {
    const { occupation, updated } = await this.occupationsService.update(id, updateOccupationDto);
    const message = updated
      ? 'Update complete — your occupation is current.'
      : "Everything's already up to date!";
    return {
      data: occupation,
      message,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id/archive')
  @RequirePermissions('occupation:archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.occupationsService.archive(id);
    return {
      message: 'Occupation archived successfully.',
      data,
    };
  }
}
