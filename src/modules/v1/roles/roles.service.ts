import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationService } from '../../../common/pagination';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
@Injectable()
export class RolesService {
  private readonly roleSelect = {
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
  findAll() {
    return `This action returns all roles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  async create(createRoleDto: CreateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(`The role ${createRoleDto.name} already exists`);
      }

      const role = await tx.role.create({
        data: createRoleDto,
        select: this.roleSelect,
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

  private formatRole(role: RoleResponse) {
    const phUpdatedTime = toZonedTime(role.updatedAt, this.timezone);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      group: role.group,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(role.deletedAt && {
        deletedAt: format(toZonedTime(role.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
