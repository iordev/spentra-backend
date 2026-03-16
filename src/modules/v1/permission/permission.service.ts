import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';
import { PaginatedResult, PaginationDto, PaginationService, Status } from '../../../common';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';

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
  deletedAt?: string;
};

@Injectable()
export class PermissionService {
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

  async create(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: createPermissionDto.name },
    });

    if (existingPermission) {
      throw new ConflictException(`The permission ${createPermissionDto.name} already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: createPermissionDto,
      select: this.permissionSelect,
    });

    return this.formatPermission(permission);
  }

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

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: this.permissionSelect,
    });

    if (!permission) {
      throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
    }

    return this.formatPermission(permission);
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<{ permission: FormattedPermission; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: { id },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
      }

      // Check for duplicate name only if it's being changed
      if (updatePermissionDto.name && updatePermissionDto.name !== existingPermission.name) {
        const duplicateName = await tx.permission.findUnique({
          where: { name: updatePermissionDto.name },
        });
        if (duplicateName) {
          throw new ConflictException(`The permission ${updatePermissionDto.name} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = (Object.keys(updatePermissionDto) as (keyof UpdatePermissionDto)[]).some(
        (key) => updatePermissionDto[key] !== existingPermission[key],
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
        where: { id },
        data: updatePermissionDto,
        select: this.permissionSelect,
      });

      return {
        permission: this.formatPermission(updatedPermission),
        updated: true,
      };
    });
  }

  async archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingPermission = await tx.permission.findUnique({
        where: {
          id,
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
        where: { id },
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
