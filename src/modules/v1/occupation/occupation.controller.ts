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
import { OccupationService } from './occupation.service';
import { CreateOccupationDto, UpdateOccupationDto } from './dto';
import { PaginationDto } from '../../../common/pagination/dto';
import { BaseUrl } from '../../../common/decorators';

@Controller('api/v1/occupations')
export class OccupationController {
  constructor(private readonly occupationsService: OccupationService) {}

  @Get()
  async findAll(@Query() query: PaginationDto, @BaseUrl() baseUrl: string) {
    const data = await this.occupationsService.findAll(query, baseUrl);
    return {
      message: 'Your occupations are now displayed.',
      ...data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.occupationsService.findOne(id);
    return {
      message: 'Here are the details of the occupation.',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOccupationDto: CreateOccupationDto) {
    const data = await this.occupationsService.create(createOccupationDto);
    return {
      message: 'Great! Your occupation is ready to go.',
      data,
    };
  }

  @Patch(':id')
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

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id', ParseIntPipe) id: number) {
    const data = await this.occupationsService.archive(id);
    return {
      message: 'Occupation archived successfully.',
      data,
    };
  }
}
