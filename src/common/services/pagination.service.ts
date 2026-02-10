import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
  links: {
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  };
}

// Generic type for Prisma model delegate
type PrismaModelDelegate<TSelect, T> = {
  count(args?: { where?: Prisma.Enumerable<any> }): Promise<number>;
  findMany(args: {
    where?: Prisma.Enumerable<any>;
    orderBy?: Prisma.Enumerable<any>;
    select?: TSelect;
    include?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]>;
};

@Injectable()
export class PaginationService {
  public async paginate<TSelect, T>(
    model: PrismaModelDelegate<TSelect, T>,
    query: PaginationQuery,
    request: Request,
    options?: {
      where?: Prisma.Enumerable<any>;
      orderBy?: Prisma.Enumerable<any>;
      select?: TSelect;
      include?: any;
    },
  ): Promise<PaginatedResult<T>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    // Total items
    const total = await model.count({
      where: options?.where,
    });

    // Fetch paginated data
    const data = await model.findMany({
      where: options?.where,
      orderBy: options?.orderBy,
      select: options?.select,
      include: options?.include,
      skip,
      take: limit,
    });

    const lastPage = Math.ceil(total / limit);

    // Build pagination links
    const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;
    const createLink = (p: number) => `${baseUrl}?page=${p}&limit=${limit}`;

    return {
      data,
      meta: {
        total,
        perPage: limit,
        currentPage: page,
        lastPage,
      },
      links: {
        first: createLink(1),
        prev: page > 1 ? createLink(page - 1) : null,
        next: page < lastPage ? createLink(page + 1) : null,
        last: createLink(lastPage),
      },
    };
  }
}
