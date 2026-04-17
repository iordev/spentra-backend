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
import { TimezoneService } from './timezone.service';
import { CreateTimezoneDto, UpdateTimezoneDto } from './dto';
import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';

@Controller('api/v1/timezones')
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  @Get()
  // @RequirePermissions('timezone:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.timezoneService.findAll(query, baseUrl);

    if (Array.isArray(data)) {
      return {
        message: 'Your timezones are now displayed.',
        data,
      };
    }
    return {
      message: 'Your timezones are now displayed.',
      ...data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('timezone:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.timezoneService.findOne(id);
    return {
      message: 'Here are the details of the timezone.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('timezone:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTimezoneDto: CreateTimezoneDto) {
    const data = await this.timezoneService.create(createTimezoneDto);
    return {
      message: 'Great! Your timezone is ready to go.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('timezone:update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimezoneDto: UpdateTimezoneDto,
  ) {
    const { timezone, updated } = await this.timezoneService.update(id, updateTimezoneDto);
    const message = updated
      ? 'Update complete — your timezone is current.'
      : "Everything's already up to date!";
    return {
      data: timezone,
      message,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id/archive')
  @RequirePermissions('timezone:archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.timezoneService.archive(id);
    return {
      message: 'Timezone archived successfully.',
      data,
    };
  }
}
