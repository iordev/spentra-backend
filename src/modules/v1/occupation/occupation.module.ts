import { Module } from '@nestjs/common';
import { OccupationService } from './occupation.service';
import { OccupationController } from './occupation.controller';
import { PaginationModule } from '../../../common/pagination';

@Module({
  imports: [PaginationModule],
  controllers: [OccupationController],
  providers: [OccupationService],
})
export class OccupationModule {}
