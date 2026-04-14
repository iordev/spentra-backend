import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  FacebookStrategy,
  GoogleStrategy,
  JwtAccessStrategy,
  JwtRefreshStrategy,
  MicrosoftStrategy,
} from './strategies';
import { SlidingSessionMiddleware } from './middleware';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    MicrosoftStrategy,
    FacebookStrategy,
    SlidingSessionMiddleware,
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SlidingSessionMiddleware).forRoutes('*'); // ← runs on every route
  }
}
