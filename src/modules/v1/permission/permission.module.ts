import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PaginationModule } from '../../../common';

@Module({
  imports: [PaginationModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
