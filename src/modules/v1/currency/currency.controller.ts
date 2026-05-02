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
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto';
import { BaseUrl, PaginationDto, RequirePermissions } from '../../../common';
import { JwtAccessGuard, PermissionsGuard } from '../auth/guards';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @SkipThrottle()
  @Get()
  // @RequirePermissions('currency:display')
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this?.currencyService?.findAll(query, baseUrl);
    if (Array.isArray(data)) {
      return {
        message: 'Your currencies are now displayed.',
        data,
      };
    }
    return {
      message: 'Your currencies are now displayed.',
      ...data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('currency:display')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.currencyService.findOne(id);
    return {
      message: 'Here are the details of the currency.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('currency:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCurrencyDto: CreateCurrencyDto) {
    const data = await this.currencyService.create(createCurrencyDto);
    return {
      message: 'Great! Your currency is ready to go.',
      data,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('currency:update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ) {
    const { currency, updated } = await this.currencyService.update(id, updateCurrencyDto);
    const message = updated
      ? 'Update complete — your currency is current.'
      : "Everything's already up to date!";
    return {
      data: currency,
      message,
    };
  }

  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Patch(':id/archive')
  @RequirePermissions('currency:archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.currencyService.archive(id);
    return {
      message: 'Currency archived successfully.',
      data,
    };
  }
}
