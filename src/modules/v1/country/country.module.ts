import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { CountryController } from './country.controller';
import { PaginationModule } from '../../../common/pagination';

@Module({
  imports: [PaginationModule],
  controllers: [CountryController],
  providers: [CountryService],
})
export class CountryModule {}
