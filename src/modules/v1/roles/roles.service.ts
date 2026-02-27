import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationService } from '../../../common/pagination';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';

type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
  group: string | null;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedRole = {
  id: number;
  name: string;
  description: string | null;
  group: string | null;
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
      // include other permission fields if needed
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
  findAll() {
    return `This action returns all roles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
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
        // (Optional) Double‑check uniqueness, though DTO already does it
        const uniquePermissions = [...new Set(permissions)];
        if (uniquePermissions.length !== permissions.length) {
          throw new ConflictException('Permission IDs must be unique');
        }

        const existingPermissions = await tx.permission.findMany({
          where: { id: { in: permissions } },
          select: { id: true },
        });

        const existingIds = existingPermissions.map((p) => p.id);
        const missingIds = permissions.filter((id) => !existingIds.includes(id));

        if (missingIds.length > 0) {
          throw new NotFoundException(`Permissions with IDs ${missingIds.join(', ')} not found`);
        }
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
        select: roleSelect, // Make sure this includes 'permissions' if you need them in the response
      });

      return this.formatRole(role);
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  archive(id: number) {
    return `This action removes a #${id} role`;
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
