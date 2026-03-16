import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAccessStrategy, JwtRefreshStrategy } from './strategies';
import { SlidingSessionMiddleware } from './middleware';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // ← secrets handled per strategy
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    SlidingSessionMiddleware,
  ],
  exports: [AuthService], // ← export if other modules need auth
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SlidingSessionMiddleware).forRoutes('*'); // ← runs on every route
  }
}
