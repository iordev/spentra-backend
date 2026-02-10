import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { PaginationDto, Status } from '../../../common/dto';
import { Permission, Prisma } from '@prisma/client';
import { PaginationService } from '../../../common/services';
import type { Request } from 'express';

type PermissionResponse = {
  id: number;
  name: string;
  description: string | null;
  group: string | null;
  updatedAt: Date;
  deletedAt?: Date | null;
};

@Injectable()
export class PermissionsService {
  private readonly permissionSelect = {
    id: true,
    name: true,
    description: true,
    group: true,
    updatedAt: true,
    deletedAt: true,
  };

  private readonly timezone = 'Asia/Manila';

  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  findAllPermissions(query: PaginationDto, request: Request) {
    const where: Prisma.PermissionWhereInput = {};

    // Status filter
    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    // Search filter
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    return this.paginationService.paginate<Prisma.PermissionSelect, Permission>(
      this.prisma.permission,
      query,
      request,
      {
        where,
        orderBy,
        select: this.permissionSelect,
      },
    );
  }

  async createPermission(dto: PermissionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: { name: dto.name },
      });

      if (existingPermission) {
        throw new ConflictException(`The permission name ${dto.name} already exists`);
      }

      const permission = await tx.permission.create({
        data: dto,
        select: this.permissionSelect,
      });

      return {
        message: 'Permission created successfully',
        result: this.formatPermission(permission),
      };
    });
  }

  async updatePermission(permissionId: number, dto: PermissionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: { id: permissionId },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Permission with id ${permissionId} not found`);
      }

      // Check if any changes were made
      const hasChanges = Object.keys(dto).some((key) => dto[key] !== existingPermission[key]);

      if (!hasChanges) {
        return {
          message: 'No changes detected',
        };
      }

      // Check for duplicate name (only if name is changing)
      if (dto.name !== existingPermission.name) {
        const duplicateName = await tx.permission.findUnique({
          where: { name: dto.name },
        });

        if (duplicateName) {
          throw new ConflictException(`The permission name ${dto.name} already exists`);
        }
      }

      const updatedPermission = await tx.permission.update({
        where: { id: permissionId },
        data: dto,
        select: this.permissionSelect,
      });

      return {
        message: 'Permission updated successfully',
        result: this.formatPermission(updatedPermission),
      };
    });
  }

  async archivePermission(permissionId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: {
          id: permissionId,
          deletedAt: null,
        },
        include: {
          roles: {
            where: {
              deletedAt: null, // Only check active roles
            },
          },
        },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Permission with id ${permissionId} not found`);
      }

      // Check if permission is assigned to any active roles
      if (existingPermission.roles.length > 0) {
        throw new ConflictException(
          `The permission you’re trying to archive is currently being used.`,
        );
      }

      const archivedPermission = await tx.permission.update({
        where: { id: permissionId },
        data: {
          deletedAt: new Date(),
        },
        select: this.permissionSelect,
      });

      return {
        message: 'Permission archived successfully',
        result: this.formatPermission(archivedPermission),
      };
    });
  }

  private formatPermission(permission: PermissionResponse) {
    const phUpdatedTime = toZonedTime(permission.updatedAt, this.timezone);

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      group: permission.group,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(permission.deletedAt && {
        deletedAt: format(toZonedTime(permission.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
