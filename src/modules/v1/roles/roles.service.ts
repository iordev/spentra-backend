import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginatedResult, PaginationService } from '../../../common/pagination';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';
import { validatePermissions } from './helpers';
import { PaginationDto, Status } from '../../../common/pagination/dto';

type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedRole = {
  id: number;
  name: string;
  description: string | null;
  updatedAt: string;
  deletedAt?: string | null;
};

const roleSelect = {
  id: true,
  name: true,
  description: true,
  permissions: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  deletedAt: true, // if you have soft delete
} as const;

type RoleWithPermissions = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;

@Injectable()
export class RolesService {
  private readonly timezone = 'Asia/Manila';

  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async findAll(query: PaginationDto, baseUrl: string): Promise<PaginatedResult<FormattedRole>> {
    const where: Prisma.RoleWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.RoleOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(this.prisma.role, query, baseUrl, {
      where,
      orderBy,
      select: roleSelect,
    });

    // Format dates using map
    const formattedData = paginated.data.map((role) =>
      this.formatRole(role as RoleWithPermissions),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: roleSelect,
    });

    if (!role) {
      throw new NotFoundException(`Oops! The permission you’re looking for doesn’t exist.`);
    }

    return this.formatRole(role);
  }

  async create(createRoleDto: CreateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const { permissions, ...roleData } = createRoleDto;

      const existingRole = await tx.role.findUnique({
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(`The role ${createRoleDto.name} already exists`);
      }

      // If permissions are provided, validate they exist
      if (permissions && permissions.length > 0) {
        await validatePermissions(tx, permissions);
      }

      // Create the role and connect permissions
      const role = await tx.role.create({
        data: {
          ...roleData,
          permissions:
            permissions && permissions.length > 0
              ? { connect: permissions.map((id) => ({ id })) }
              : undefined,
        },
        select: roleSelect,
      });

      return this.formatRole(role);
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const { permissions, ...roleData } = updateRoleDto;

      // Check if role exists
      const existingRole = await tx.role.findUnique({
        where: { id },
        include: { permissions: { select: { id: true, name: true } } },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role not found!`);
      }

      // Check for duplicate name if name is being changed
      if (roleData.name && roleData.name !== existingRole.name) {
        const duplicateRole = await tx.role.findUnique({
          where: { name: roleData.name },
        });

        if (duplicateRole) {
          throw new ConflictException(`The role ${roleData.name} already exists`);
        }
      }

      // Validate permission IDs if provided
      if (permissions && permissions.length > 0) {
        await validatePermissions(tx, permissions);
      }

      // Check if scalar fields actually changed
      const hasScalarChanges = (Object.keys(roleData) as (keyof typeof roleData)[]).some(
        (key) => roleData[key] !== existingRole[key],
      );

      // Check if permissions actually changed
      const existingPermissionIds = existingRole.permissions.map((p) => p.id).sort();
      const incomingPermissionIds = permissions ? [...permissions].sort() : null;
      const hasPermissionChanges =
        incomingPermissionIds !== null &&
        JSON.stringify(incomingPermissionIds) !== JSON.stringify(existingPermissionIds);

      if (!hasScalarChanges && !hasPermissionChanges) {
        return {
          role: this.formatRole(
            (await tx.role.findUnique({
              where: { id },
              select: roleSelect,
            })) as RoleWithPermissions,
          ),
          updated: false,
        };
      }

      // Update the role
      const updatedRole = await tx.role.update({
        where: { id },
        data: {
          ...roleData,
          ...(incomingPermissionIds !== null && {
            permissions: { set: permissions!.map((permId) => ({ id: permId })) },
          }),
        },
        select: roleSelect,
      });

      return {
        role: this.formatRole(updatedRole),
        updated: true,
      };
    });
  }

  async archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          users: {
            where: {
              deletedAt: null, // Only check active users
            },
          },
        },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role not found!`);
      }

      // Check if role is assigned to any active users
      if (existingRole.users.length > 0) {
        throw new ConflictException(`The role you're trying to archive is currently being used.`);
      }

      const archivedRole = await tx.role.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: roleSelect,
      });

      return this.formatRole(archivedRole);
    });
  }

  private formatRole(role: RoleWithPermissions) {
    const phUpdatedTime = toZonedTime(role.updatedAt, this.timezone);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions, // Now TypeScript knows about this
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(role.deletedAt && {
        deletedAt: format(toZonedTime(role.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
