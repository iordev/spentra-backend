import { Module } from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { TimezoneController } from './timezone.controller';
import { PaginationModule } from '../../../common/pagination';

@Module({
  imports: [PaginationModule],
  controllers: [TimezoneController],
  providers: [TimezoneService],
})
export class TimezoneModule {}
