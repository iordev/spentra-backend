import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: PermissionDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingPermission = await tx.permission.findUnique({
          where: { name: dto.name },
        });

        if (existingPermission) {
          throw new ConflictException(`The permission name "${dto.name}" already exists`);
        }

        const permission = await tx.permission.create({
          data: dto,
        });

        return {
          message: 'Permission created successfully',
          data: permission,
        };
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create permission. Please try again.');
    }
  }
}
