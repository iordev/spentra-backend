import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationDto, Status } from '../../../common/pagination/dto';
import { PaginatedResult, PaginationService } from '../../../common/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import * as bcrypt from 'bcrypt';

type UserResponse = {
  id: number;
  email: string;
  username?: string | null;
  emailVerified: boolean;
  fullName: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  birthDate?: Date | null;
  gender: string;
  dateFormat?: string | null;
  avatarUrl?: string | null;
  theme: string;
  role: { id: number; name: string };
  occupation: { id: number; name: string };
  currency?: { id: number; name: string; code: string } | null;
  timezone?: { id: number; name: string } | null;
  country?: { id: number; name: string } | null;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type FormattedUser = {
  id: number;
  email: string;
  username?: string | null;
  emailVerified: boolean;
  profile: {
    fullName: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    suffix?: string | null;
    birthDate?: string | null;
    gender: string;
    avatarUrl?: string | null;
  };
  preferences: {
    dateFormat?: string | null;
    theme: string;
    role: { id: number; name: string };
    occupation: { id: number; name: string };
    currency?: { id: number; name: string; code: string } | null;
    timezone?: { id: number; name: string } | null;
    country?: { id: number; name: string } | null;
  };
  updatedAt: string;
  deletedAt?: string | null;
};

@Injectable()
export class UserService {
  private readonly userSelect = {
    id: true,
    email: true,
    username: true,
    emailVerified: true,

    fullName: true,
    firstName: true,
    middleName: true,
    lastName: true,
    suffix: true,
    birthDate: true,
    gender: true,

    dateFormat: true,
    avatarUrl: true,
    theme: true,
    role: { select: { id: true, name: true } },
    occupation: { select: { id: true, name: true } },
    currency: { select: { id: true, name: true, code: true } },
    timezone: { select: { id: true, name: true } },
    country: { select: { id: true, name: true } },
    updatedAt: true,
    deletedAt: true,
  };
  private readonly timezone = 'Asia/Manila';
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<FormattedUser> {
    const {
      email,
      fullName,
      firstName,
      middleName,
      lastName,
      suffix,
      username,
      password,
      birthDate,
      gender,
      avatarUrl,
      dateFormat,
      theme,
      roleId,
      occupationId,
      currencyId,
      timezoneId,
      countryId,
    } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.email === email
          ? 'A user with this email already exists.'
          : 'A user with this username already exists.',
      );
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        firstName,
        middleName,
        lastName,
        suffix,
        username,
        password: hashedPassword,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        avatarUrl,
        dateFormat,
        theme,
        roleId,
        occupationId,
        currencyId,
        timezoneId,
        countryId,
      },
      select: this.userSelect,
    });

    return this.formatUser(user as UserResponse);
  }

  async findAll(query: PaginationDto, baseUrl: string): Promise<PaginatedResult<FormattedUser>> {
    const where: Prisma.UserWhereInput = {};

    if (query.status === Status.ACTIVE) {
      where.deletedAt = null;
    } else if (query.status === Status.INACTIVE) {
      where.deletedAt = { not: null };
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Explicitly type orderBy to avoid any
    const orderBy: Prisma.UserOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc' }
      : { updatedAt: 'desc' };

    // Call paginate
    const paginated = await this.paginationService.paginate(this.prisma.user, query, baseUrl, {
      where,
      orderBy,
      select: this.userSelect,
    });

    // Format dates using map
    const formattedData = paginated.data.map((user) => this.formatUser(user as UserResponse));

    return {
      ...paginated,
      data: formattedData,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`Oops! The user you’re looking for doesn’t exist.`);
    }

    return this.formatUser(user);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  private formatUser(user: UserResponse): FormattedUser {
    const phUpdatedTime = toZonedTime(user.updatedAt, this.timezone);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
      profile: {
        fullName: user.fullName,
        firstName: user.firstName,
        middleName: user.middleName ?? '-',
        lastName: user.lastName,
        suffix: user.suffix ?? '-',
        birthDate: user.birthDate
          ? format(toZonedTime(user.birthDate, this.timezone), 'MMMM d, yyyy')
          : null,
        gender: user.gender,
        avatarUrl: user.avatarUrl,
      },
      preferences: {
        dateFormat: user.dateFormat,
        theme: user.theme,
        role: user.role,
        occupation: user.occupation,
        currency: user.currency,
        timezone: user.timezone,
        country: user.country,
      },
      updatedAt: format(phUpdatedTime, 'MMMM d, yyyy h:mm a'),
      deletedAt: user.deletedAt
        ? format(toZonedTime(user.deletedAt, this.timezone), 'MMMM d, yyyy h:mm a')
        : null,
    };
  }
}
