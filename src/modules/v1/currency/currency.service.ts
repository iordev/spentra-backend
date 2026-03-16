import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginatedResult, PaginationDto, PaginationService, Status } from '../../../common';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type CurrencyResponse = {
  id: number;
  name: string;
  code: string;
  symbol: string;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedCurrency = {
  id: number;
  name: string;
  code: string;
  symbol: string;
  updatedAt: string;
  deletedAt?: string;
};
@Injectable()
export class CurrencyService {
  private readonly currencySelect = {
    id: true,
    name: true,
    code: true,
    symbol: true,
    updatedAt: true,
    deletedAt: true,
  };
  private readonly timezone = 'Asia/Manila';
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async create(createCurrencyDto: CreateCurrencyDto) {
    const existingCurrency = await this.prisma.currency.findUnique({
      where: { code: createCurrencyDto.code },
    });

    if (existingCurrency) {
      throw new ConflictException(`The currency code ${createCurrencyDto.code} already exists`);
    }

    const currency = await this.prisma.currency.create({
      data: createCurrencyDto,
      select: this.currencySelect,
    });

    return this.formatCurrency(currency);
  }

  async findAll(
    query: PaginationDto,
    baseUrl: string,
  ): Promise<PaginatedResult<FormattedCurrency>> {
    const where: Prisma.CurrencyWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.CurrencyOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(this.prisma.currency, query, baseUrl, {
      where,
      orderBy,
      select: this.currencySelect,
    });

    // Format dates using map
    const formattedData = paginated.data.map((currency) =>
      this.formatCurrency(currency as CurrencyResponse),
    );

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
      select: this.currencySelect,
    });

    if (!currency) {
      throw new NotFoundException(`Oops! The currency you’re looking for doesn’t exist.`);
    }

    return this.formatCurrency(currency);
  }

  update(
    id: number,
    updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<{ currency: FormattedCurrency; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existingCurrency = await tx.currency.findUnique({
        where: { id },
      });

      if (!existingCurrency) {
        throw new NotFoundException(`Oops! The currency you’re looking for doesn’t exist.`);
      }

      // Check for duplicate code only if it's being changed
      if (updateCurrencyDto.code && updateCurrencyDto.code !== existingCurrency.code) {
        const duplicateCode = await tx.currency.findUnique({
          where: { code: updateCurrencyDto.code },
        });
        if (duplicateCode) {
          throw new ConflictException(`The currency code ${updateCurrencyDto.code} already exists`);
        }
      }

      // Determine if any field actually changed
      const hasChanges = (Object.keys(updateCurrencyDto) as (keyof UpdateCurrencyDto)[]).some(
        (key) => updateCurrencyDto[key] !== existingCurrency[key],
      );

      if (!hasChanges) {
        // No changes – return existing currency and updated = false
        return {
          currency: this.formatCurrency(existingCurrency),
          updated: false,
        };
      }

      // Apply updates
      const updatedCurrency = await tx.currency.update({
        where: { id },
        data: updateCurrencyDto,
        select: this.currencySelect,
      });

      return {
        currency: this.formatCurrency(updatedCurrency),
        updated: true,
      };
    });
  }

  archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingCurrency = await tx.currency.findUnique({
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

      if (!existingCurrency) {
        throw new NotFoundException(`Oops! The currency you’re looking for doesn’t exist.`);
      }

      // Check if currency is assigned to any active roles
      if (existingCurrency.users.length > 0) {
        throw new ConflictException(
          `The currency you’re trying to archive is currently being used.`,
        );
      }

      const archivedCurrency = await tx.currency.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: this.currencySelect,
      });

      return this.formatCurrency(archivedCurrency);
    });
  }

  private formatCurrency(currency: CurrencyResponse) {
    const phUpdatedTime = toZonedTime(currency.updatedAt, this.timezone);

    return {
      id: currency.id,
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      ...(currency.deletedAt && {
        deletedAt: format(toZonedTime(currency.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a'),
      }),
    };
  }
}
