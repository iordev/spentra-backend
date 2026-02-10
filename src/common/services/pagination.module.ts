// common/services/common-services.module.ts
import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service';

@Module({
  providers: [PaginationService],
  exports: [PaginationService], // important! make it available to other modules
})
export class PaginationModule {}
