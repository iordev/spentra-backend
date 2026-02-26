import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PermissionsModule } from './modules/v1/permissions/permissions.module';
import { RolesModule } from './modules/v1/roles/roles.module';
import { UsersModule } from './modules/v1/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
