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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PermissionModule,
    RoleModule,
    UserModule,
    OccupationModule,
    CountryModule,
    TimezoneModule,
    CurrencyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
