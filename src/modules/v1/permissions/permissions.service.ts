import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';
import { PaginationDto, Status } from '../../../common/pagination/dto';
import { PaginatedResult, PaginationService } from '../../../common/pagination';

type PermissionResponse = {
  id: number;
  name: string;
  description: string | null;
  group: string | null;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedPermission = {
  id: number;
  name: string;
  description: string | null;
  group: string | null;
  updatedAt: string;
  deletedAt?: string | null;
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

  async findAll(
    query: PaginationDto,
    baseUrl: string,
  ): Promise<PaginatedResult<FormattedPermission>> {
    const where: Prisma.PermissionWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.PermissionOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(
      this.prisma.permission,
      query,
      baseUrl,
      {
        where,
        orderBy,
        select: this.permissionSelect,
      },
    );

    // Format dates using map
    const formattedData = paginated.data.map((permission) =>
      this.formatPermission(permission as PermissionResponse),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(permissionId: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
    }

    return this.formatPermission(permission);
  }

  async create(permissionDto: PermissionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: { name: permissionDto.name },
      });

      if (existingPermission) {
        throw new ConflictException(`The permission ${permissionDto.name} already exists`);
      }

      const permission = await tx.permission.create({
        data: permissionDto,
        select: this.permissionSelect,
      });

      return this.formatPermission(permission);
    });
  }

  async update(
    permissionId: number,
    permissionDto: PermissionDto,
  ): Promise<{ permission: FormattedPermission; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: { id: permissionId },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
      }

      // Check for duplicate name only if it's being changed
      if (permissionDto.name && permissionDto.name !== existingPermission.name) {
        const duplicateName = await tx.permission.findUnique({
          where: { name: permissionDto.name },
        });
        if (duplicateName) {
          throw new ConflictException(`The permission ${permissionDto.name} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = Object.keys(permissionDto).some(
        (key) => permissionDto[key] !== existingPermission[key],
      );

      if (!hasChanges) {
        // No changes – return existing permission and updated = false
        return {
          permission: this.formatPermission(existingPermission),
          updated: false,
        };
      }

      // Apply updates
      const updatedPermission = await tx.permission.update({
        where: { id: permissionId },
        data: permissionDto,
        select: this.permissionSelect,
      });

      return {
        permission: this.formatPermission(updatedPermission),
        updated: true,
      };
    });
  }

  async archive(permissionId: number) {
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
        throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
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

      return this.formatPermission(archivedPermission);
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
