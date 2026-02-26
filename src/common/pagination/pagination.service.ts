import { Injectable } from '@nestjs/common';

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
    baseUrl: string,
    options?: {
      where?: WhereInput<M>;
      orderBy?: OrderByInput<M>;
      select?: TSelect;
      include?: IncludeInput<M>;
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

    // Build link by appending page and limit to the baseUrl
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
