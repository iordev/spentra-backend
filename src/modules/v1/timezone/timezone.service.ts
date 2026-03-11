import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTimezoneDto, UpdateTimezoneDto } from './dto';
import { PaginationDto, Status } from '../../../common/pagination/dto';
import { PaginatedResult, PaginationService } from '../../../common/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type TimezoneResponse = {
  id: number;
  name: string;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedTimezone = {
  id: number;
  name: string;
  updatedAt: string;
  deletedAt?: string;
};
@Injectable()
export class TimezoneService {
  private readonly timezoneSelect = {
    id: true,
    name: true,
    updatedAt: true,
    deletedAt: true,
  };
  private readonly timezone = 'Asia/Manila';
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async create(createTimezoneDto: CreateTimezoneDto) {
    const existingTimezone = await this.prisma.timezone.findUnique({
      where: { name: createTimezoneDto.name },
    });

    if (existingTimezone) {
      throw new ConflictException(`The name ${createTimezoneDto.name} already exists`);
    }

    const timezone = await this.prisma.timezone.create({
      data: createTimezoneDto,
      select: this.timezoneSelect,
    });

    return this.formatTimezone(timezone);
  }

  async findAll(
    query: PaginationDto,
    baseUrl: string,
  ): Promise<PaginatedResult<FormattedTimezone>> {
    const where: Prisma.TimezoneWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.TimezoneOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(this.prisma.timezone, query, baseUrl, {
      where,
      orderBy,
      select: this.timezoneSelect,
    });

    // Format dates using map
    const formattedData = paginated.data.map((timezone) =>
      this.formatTimezone(timezone as TimezoneResponse),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const timezone = await this.prisma.timezone.findUnique({
      where: { id },
      select: this.timezoneSelect,
    });

    if (!timezone) {
      throw new NotFoundException(`Oops! The timezone you’re looking for doesn’t exist.`);
    }

    return this.formatTimezone(timezone);
  }

  update(
    id: number,
    updateTimezoneDto: UpdateTimezoneDto,
  ): Promise<{ timezone: FormattedTimezone; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingTimezone = await tx.timezone.findUnique({
        where: { id },
      });

      if (!existingTimezone) {
        throw new NotFoundException(`Oops! The timezone you’re looking for doesn’t exist.`);
      }

      // Check for duplicate name only if it's being changed
      if (updateTimezoneDto.name && updateTimezoneDto.name !== existingTimezone.name) {
        const duplicateName = await tx.timezone.findUnique({
          where: { name: updateTimezoneDto.name },
        });
        if (duplicateName) {
          throw new ConflictException(`The name ${updateTimezoneDto.name} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = (Object.keys(updateTimezoneDto) as (keyof UpdateTimezoneDto)[]).some(
        (key) => updateTimezoneDto[key] !== existingTimezone[key],
      );

      if (!hasChanges) {
        // No changes – return existing timezone and updated = false
        return {
          timezone: this.formatTimezone(existingTimezone),
          updated: false,
        };
      }

      // Apply updates
      const updatedTimezone = await tx.timezone.update({
        where: { id },
        data: updateTimezoneDto,
        select: this.timezoneSelect,
      });

      return {
        timezone: this.formatTimezone(updatedTimezone),
        updated: true,
      };
    });
  }

  archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingTimezone = await tx.timezone.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          users: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

      if (!existingTimezone) {
        throw new NotFoundException(`Oops! The timezone you’re looking for doesn’t exist.`);
      }

      // Check if timezone is assigned to any active roles
      if (existingTimezone.users.length > 0) {
        throw new ConflictException(
          `The timezone you’re trying to archive is currently being used.`,
        );
      }

      const archivedTimezone = await tx.timezone.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: this.timezoneSelect,
      });

      return this.formatTimezone(archivedTimezone);
    });
  }

  private formatTimezone(timezone: TimezoneResponse) {
    const phUpdatedTime = toZonedTime(timezone.updatedAt, this.timezone);

    return {
      id: timezone.id,
      name: timezone.name,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(timezone.deletedAt && {
        deletedAt: format(toZonedTime(timezone.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
