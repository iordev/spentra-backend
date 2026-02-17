import { Injectable } from '@nestjs/common';
import { Request } from 'express';

/*
|--------------------------------------------------------------------------
| Helper Types (Type-Safe Prisma Extraction)
|--------------------------------------------------------------------------
*/

type WhereInput<T> = T extends { count: (args?: infer A) => any }
  ? A extends { where?: infer W }
    ? W
    : never
  : never;

type OrderByInput<T> = T extends { findMany: (args?: infer A) => any }
  ? A extends { orderBy?: infer O }
    ? O
    : never
  : never;

type IncludeInput<T> = T extends { findMany: (args?: infer A) => any }
  ? A extends { include?: infer I }
    ? I
    : never
  : never;

/*
|--------------------------------------------------------------------------
| Prisma Delegate Base Type
|--------------------------------------------------------------------------
*/

type PrismaModelDelegate<TSelect, T> = {
  count(args?: { where?: any }): Promise<number>;
  findMany(args?: {
    where?: any;
    orderBy?: any;
    select?: TSelect;
    include?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]>;
};

/*
|--------------------------------------------------------------------------
| Pagination Interfaces
|--------------------------------------------------------------------------
*/

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  message: string | null;
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

/*
|--------------------------------------------------------------------------
| Pagination Service
|--------------------------------------------------------------------------
*/

@Injectable()
export class PaginationService {
  async paginate<TSelect, T, M extends PrismaModelDelegate<TSelect, T>>(
    model: M,
    query: PaginationQuery,
    request: Request,
    options?: {
      where?: WhereInput<M>;
      orderBy?: OrderByInput<M>;
      select?: TSelect;
      include?: IncludeInput<M>;
      message: string;
    },
  ): Promise<PaginatedResult<T>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const total = await model.count({
      where: options?.where,
    });

    const data = await model.findMany({
      where: options?.where,
      orderBy: options?.orderBy,
      select: options?.select,
      include: options?.include,
      skip,
      take: limit,
    });

    const lastPage = Math.ceil(total / limit);

    const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;

    const createLink = (p: number) => `${baseUrl}?page=${p}&limit=${limit}`;

    return {
      message: options?.message || null,
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
