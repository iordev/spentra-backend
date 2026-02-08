import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPermissionDto, PermissionDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';

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

  constructor(private prisma: PrismaService) {}

  async findAllPermissions(dto: GetPermissionDto) {
    const { status, page, limit, search, sortBy, sortOrder } = dto;
    const whereClause: Prisma.PermissionWhereInput = {};

    // Filter by status
    if (status === 'Active') {
      whereClause.deletedAt = null;
    } else if (status === 'Inactive') {
      whereClause.deletedAt = { not: null };
    }

    // Add search functionality (optional)
    if (search) {
      whereClause.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const orderByField = sortBy || 'updatedAt';
    const orderByDirection = sortOrder || 'desc';

    const permissions = await this.prisma.permission.findMany({
      where: whereClause,
      select: this.permissionSelect,
      orderBy: {
        [orderByField]: orderByDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.permission.count({ where: whereClause });

    return {
      message: 'Permissions retrieved successfully',
      result: permissions.map((permission) => this.formatPermission(permission)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
