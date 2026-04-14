import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PermissionModule } from './modules/v1/permission/permission.module';
import { RoleModule } from './modules/v1/role/role.module';
import { UserModule } from './modules/v1/user/user.module';
import { OccupationModule } from './modules/v1/occupation/occupation.module';
import { CountryModule } from './modules/v1/country/country.module';
import { TimezoneModule } from './modules/v1/timezone/timezone.module';
import { CurrencyModule } from './modules/v1/currency/currency.module';
import { CommonModule } from './common';
import { AuthModule } from './modules/v1/auth/auth.module';
import * as Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './modules/v1/auth/guards';
import { MailModule } from './modules/v1/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
      }),
    }),

    // ← configure rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'auth', // ← for auth routes (strict)
        ttl: 60000, // ← 60 seconds window
        limit: 5, // ← max 5 requests per 60 seconds
      },
      {
        name: 'default', // ← for normal routes
        ttl: 60000, // ← 60 second window
        limit: 60, // ← max 60 requests per second
      },
    ]),
    PrismaModule,
    PermissionModule,
    RoleModule,
    UserModule,
    OccupationModule,
    CountryModule,
    TimezoneModule,
    CurrencyModule,
    CommonModule,
    AuthModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // ← apply globally to all routes
    },
  ],
})
export class AppModule {}
