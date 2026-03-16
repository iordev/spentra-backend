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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
