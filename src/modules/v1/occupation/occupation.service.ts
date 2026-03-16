import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOccupationDto, UpdateOccupationDto } from './dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginatedResult, PaginationDto, PaginationService, Status } from '../../../common';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Prisma } from '@prisma/client';

type OccupationResponse = {
  id: number;
  name: string;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedOccupation = {
  id: number;
  name: string;
  updatedAt: string;
  deletedAt?: string;
};
@Injectable()
export class OccupationService {
  private readonly occupationSelect = {
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

  async create(createOccupationDto: CreateOccupationDto) {
    const existingOccupation = await this.prisma.occupation.findUnique({
      where: { name: createOccupationDto.name },
    });

    if (existingOccupation) {
      throw new ConflictException(`The occupation ${createOccupationDto.name} already exists`);
    }

    const occupation = await this.prisma.occupation.create({
      data: createOccupationDto,
      select: this.occupationSelect,
    });

    return this.formatOccupation(occupation);
  }

  async findAll(
    query: PaginationDto,
    baseUrl: string,
  ): Promise<PaginatedResult<FormattedOccupation>> {
    const where: Prisma.OccupationWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.OccupationOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(
      this.prisma.occupation,
      query,
      baseUrl,
      {
        where,
        orderBy,
        select: this.occupationSelect,
      },
    );

    // Format dates using map
    const formattedData = paginated.data.map((occupation) =>
      this.formatOccupation(occupation as OccupationResponse),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const occupation = await this.prisma.occupation.findUnique({
      where: { id },
      select: this.occupationSelect,
    });

    if (!occupation) {
      throw new NotFoundException(`Oops! The occupation you’re looking for doesn’t exist.`);
    }

    return this.formatOccupation(occupation);
  }

  async update(
    id: number,
    updateOccupationDto: UpdateOccupationDto,
  ): Promise<{ occupation: FormattedOccupation; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingOccupation = await tx.occupation.findUnique({
        where: { id },
      });

      if (!existingOccupation) {
        throw new NotFoundException(`Oops! The occupation you’re looking for doesn’t exist.`);
      }

      // Check for duplicate name only if it's being changed
      if (updateOccupationDto.name && updateOccupationDto.name !== existingOccupation.name) {
        const duplicateName = await tx.occupation.findUnique({
          where: { name: updateOccupationDto.name },
        });
        if (duplicateName) {
          throw new ConflictException(`The occupation ${updateOccupationDto.name} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = (Object.keys(updateOccupationDto) as (keyof UpdateOccupationDto)[]).some(
        (key) => updateOccupationDto[key] !== existingOccupation[key],
      );

      if (!hasChanges) {
        // No changes – return existing occupation and updated = false
        return {
          occupation: this.formatOccupation(existingOccupation),
          updated: false,
        };
      }

      // Apply updates
      const updatedOccupation = await tx.occupation.update({
        where: { id },
        data: updateOccupationDto,
        select: this.occupationSelect,
      });

      return {
        occupation: this.formatOccupation(updatedOccupation),
        updated: true,
      };
    });
  }

  async archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingOccupation = await tx.occupation.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          users: {
            where: {
              deletedAt: null, // Only check active roles
            },
          },
        },
      });

      if (!existingOccupation) {
        throw new NotFoundException(`Oops! The occupation you’re looking for doesn’t exist.`);
      }

      // Check if occupation is assigned to any active roles
      if (existingOccupation.users.length > 0) {
        throw new ConflictException(
          `The occupation you’re trying to archive is currently being used.`,
        );
      }

      const archivedOccupation = await tx.occupation.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: this.occupationSelect,
      });

      return this.formatOccupation(archivedOccupation);
    });
  }

  private formatOccupation(occupation: OccupationResponse) {
    const phUpdatedTime = toZonedTime(occupation.updatedAt, this.timezone);

    return {
      id: occupation.id,
      name: occupation.name,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(occupation.deletedAt && {
        deletedAt: format(toZonedTime(occupation.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
