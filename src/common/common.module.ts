import { Global, Module } from '@nestjs/common';
import { PrismaValidatorService } from './services';

@Global()
@Module({
  providers: [PrismaValidatorService],
  exports: [PrismaValidatorService],
})
export class CommonModule {}
