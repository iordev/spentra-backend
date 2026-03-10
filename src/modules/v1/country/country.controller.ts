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
import { CountryService } from './country.service';
import { CreateCountryDto, UpdateCountryDto } from './dto';
import { PaginationDto } from '../../../common/pagination/dto';
import { BaseUrl } from '../../../common/decorators';

@Controller('api/v1/countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.countryService.findAll(query, baseUrl);
    return {
      message: 'Your countries are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.countryService.findOne(id);
    return {
      message: 'Here are the details of the country.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.create(createCountryDto);
  }

  @Patch(':id')
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

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.countryService.archive(id);
    return {
      message: 'Country archived successfully.',
      data,
    };
  }
}
