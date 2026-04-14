import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PaginationModule } from '../../../common';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PaginationModule, MailModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
