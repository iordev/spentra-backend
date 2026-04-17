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
import { CountryService } from './country.service';
import { CreateCountryDto, UpdateCountryDto } from './dto';
import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';

@Controller('api/v1/countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  // @RequirePermissions('country:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.countryService.findAll(query, baseUrl);
    if (Array.isArray(data)) {
      return {
        message: 'Your countries are now displayed.',
        data,
      };
    }

    return {
      message: 'Your countries are now displayed.',
      ...data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('country:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.countryService.findOne(id);
    return {
      message: 'Here are the details of the country.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('country:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCountryDto: CreateCountryDto) {
    const data = await this.countryService.create(createCountryDto);
    return {
      message: 'Great! Your country is ready to go.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('country:update')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCountryDto: UpdateCountryDto) {
    const { country, updated } = await this.countryService.update(id, updateCountryDto);
    const message = updated
      ? 'Update complete — your country is current.'
      : "Everything's already up to date!";
    return {
      data: country,
      message,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id/archive')
  @RequirePermissions('country:archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.countryService.archive(id);
    return {
      message: 'Country archived successfully.',
      data,
    };
  }
}
