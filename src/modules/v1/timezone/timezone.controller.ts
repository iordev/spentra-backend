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
import { TimezoneService } from './timezone.service';
import { CreateTimezoneDto, UpdateTimezoneDto } from './dto';
import { BaseUrl, PaginationDto } from '../../../common';

@Controller('api/v1/timezones')
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.timezoneService.findAll(query, baseUrl);
    return {
      message: 'Your timezones are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.timezoneService.findOne(id);
    return {
      message: 'Here are the details of the timezone.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTimezoneDto: CreateTimezoneDto) {
    const data = await this.timezoneService.create(createTimezoneDto);
    return {
      message: 'Great! Your timezone is ready to go.',
      data,
    };
  }

  @Patch(':id')
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

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.timezoneService.archive(id);
    return {
      message: 'Timezone archived successfully.',
      data,
    };
  }
}
