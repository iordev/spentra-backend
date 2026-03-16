import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCountryDto, UpdateCountryDto } from './dto';
import { PaginatedResult, PaginationDto, PaginationService, Status } from '../../../common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type CountryResponse = {
  id: number;
  name: string;
  code: string;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedCountry = {
  id: number;
  name: string;
  code: string;
  updatedAt: string;
  deletedAt?: string;
};
@Injectable()
export class CountryService {
  private readonly countrySelect = {
    id: true,
    name: true,
    code: true,
    updatedAt: true,
    deletedAt: true,
  };
  private readonly timezone = 'Asia/Manila';

  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async create(createCountryDto: CreateCountryDto) {
    const existingCountry = await this.prisma.country.findUnique({
      where: { code: createCountryDto.code },
    });

    if (existingCountry) {
      throw new ConflictException(`The country code ${createCountryDto.code} already exists`);
    }

    const country = await this.prisma.country.create({
      data: createCountryDto,
      select: this.countrySelect,
    });

    return this.formatCountry(country);
  }

  async findAll(query: PaginationDto, baseUrl: string): Promise<PaginatedResult<FormattedCountry>> {
    const where: Prisma.CountryWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.CountryOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(this.prisma.country, query, baseUrl, {
      where,
      orderBy,
      select: this.countrySelect,
    });

    // Format dates using map
    const formattedData = paginated.data.map((country) =>
      this.formatCountry(country as CountryResponse),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      select: this.countrySelect,
    });

    if (!country) {
      throw new NotFoundException(`Oops! The country you’re looking for doesn’t exist.`);
    }

    return this.formatCountry(country);
  }

  async update(
    id: number,
    updateCountryDto: UpdateCountryDto,
  ): Promise<{ country: FormattedCountry; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingCountry = await tx.country.findUnique({
        where: { id },
      });

      if (!existingCountry) {
        throw new NotFoundException(`Oops! The country you’re looking for doesn’t exist.`);
      }

      // Check for duplicate code only if it's being changed
      if (updateCountryDto.code && updateCountryDto.code !== existingCountry.code) {
        const duplicateCode = await tx.country.findUnique({
          where: { code: updateCountryDto.code },
        });
        if (duplicateCode) {
          throw new ConflictException(`The country code ${updateCountryDto.code} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = (Object.keys(updateCountryDto) as (keyof UpdateCountryDto)[]).some(
        (key) => updateCountryDto[key] !== existingCountry[key],
      );

      if (!hasChanges) {
        // No changes – return existing country and updated = false
        return {
          country: this.formatCountry(existingCountry),
          updated: false,
        };
      }

      // Apply updates
      const updatedCountry = await tx.country.update({
        where: { id },
        data: updateCountryDto,
        select: this.countrySelect,
      });

      return {
        country: this.formatCountry(updatedCountry),
        updated: true,
      };
    });
  }
  archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingCountry = await tx.country.findUnique({
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

      if (!existingCountry) {
        throw new NotFoundException(`Oops! The country you’re looking for doesn’t exist.`);
      }

      // Check if country is assigned to any active roles
      if (existingCountry.users.length > 0) {
        throw new ConflictException(
          `The country you’re trying to archive is currently being used.`,
        );
      }

      const archivedCountry = await tx.country.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: this.countrySelect,
      });

      return this.formatCountry(archivedCountry);
    });
  }

  private formatCountry(country: CountryResponse) {
    const phUpdatedTime = toZonedTime(country.updatedAt, this.timezone);

    return {
      id: country.id,
      name: country.name,
      code: country.code,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(country.deletedAt && {
        deletedAt: format(toZonedTime(country.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
