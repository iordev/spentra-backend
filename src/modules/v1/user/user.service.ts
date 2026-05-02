import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginatedResult, PaginationDto, PaginationService, Status } from '../../../common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import * as bcrypt from 'bcrypt';
import { PrismaValidatorService } from 'src/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

type UserResponse = {
  id: number;
  email: string;
  username?: string | null;
  emailVerified: boolean;
  isOnboarded: boolean;
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
  isOnboarded: boolean;
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
    isOnboarded: true,

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
    private readonly prismaValidator: PrismaValidatorService,
    private mailService: MailService,
    private config: ConfigService,
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

    await this.prismaValidator.validateIds({
      role: roleId,
      occupation: occupationId,
      currency: currencyId,
      timezone: timezoneId,
      country: countryId,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

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
        emailVerified: false,
        verificationToken,
      },
      select: this.userSelect,
    });

    // Send verification email
    const verificationLink = `${this.config.get<string>('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
    await this.mailService.sendVerificationEmail(email, firstName, verificationLink);

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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<{ user: FormattedUser; updated: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const {
        email,
        fullName,
        firstName,
        middleName,
        lastName,
        suffix,
        username,
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
      } = updateUserDto;

      // Check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }

      // Check for email/username conflicts, excluding the current user
      if (email || username) {
        const conflictingUser = await tx.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
              },
            ],
          },
        });

        if (conflictingUser) {
          throw new ConflictException(
            conflictingUser.email === email
              ? 'A user with this email already exists.'
              : 'A user with this username already exists.',
          );
        }
      }

      // Only validate IDs that are being updated
      const idsToValidate: Record<string, number | undefined> = {};
      if (roleId !== undefined) idsToValidate.role = roleId;
      if (occupationId !== undefined) idsToValidate.occupation = occupationId;
      if (currencyId !== undefined) idsToValidate.currency = currencyId;
      if (timezoneId !== undefined) idsToValidate.timezone = timezoneId;
      if (countryId !== undefined) idsToValidate.country = countryId;

      if (Object.keys(idsToValidate).length > 0) {
        await this.prismaValidator.validateIds(idsToValidate);
      }

      // Normalize birthDate for comparison
      const incomingBirthDate = birthDate ? new Date(birthDate).toISOString() : undefined;
      const existingBirthDate = existingUser.birthDate
        ? new Date(existingUser.birthDate).toISOString()
        : null;

      // Build scalar comparison map (exclude password — always rehash if provided)
      const scalarComparisons: Partial<Record<keyof typeof updateUserDto, unknown>> = {
        ...(email !== undefined && { email }),
        ...(fullName !== undefined && { fullName }),
        ...(firstName !== undefined && { firstName }),
        ...(middleName !== undefined && { middleName }),
        ...(lastName !== undefined && { lastName }),
        ...(suffix !== undefined && { suffix }),
        ...(username !== undefined && { username }),
        ...(birthDate !== undefined && { birthDate: incomingBirthDate }),
        ...(gender !== undefined && { gender }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(dateFormat !== undefined && { dateFormat }),
        ...(theme !== undefined && { theme }),
        ...(roleId !== undefined && { roleId }),
        ...(occupationId !== undefined && { occupationId }),
        ...(currencyId !== undefined && { currencyId }),
        ...(timezoneId !== undefined && { timezoneId }),
        ...(countryId !== undefined && { countryId }),
      };

      const existingComparisons = {
        ...existingUser,
        birthDate: existingBirthDate,
      };

      const hasScalarChanges = (
        Object.keys(scalarComparisons) as (keyof typeof scalarComparisons)[]
      ).some(
        (key) =>
          scalarComparisons[key] !== existingComparisons[key as keyof typeof existingComparisons],
      );

      if (!hasScalarChanges) {
        return {
          user: this.formatUser(
            (await tx.user.findUnique({
              where: { id },
              select: this.userSelect,
            })) as UserResponse,
          ),
          updated: false,
        };
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...(email !== undefined && { email }),
          ...(fullName !== undefined && { fullName }),
          ...(firstName !== undefined && { firstName }),
          ...(middleName !== undefined && { middleName }),
          ...(lastName !== undefined && { lastName }),
          ...(suffix !== undefined && { suffix }),
          ...(username !== undefined && { username }),
          ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
          ...(gender !== undefined && { gender }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(dateFormat !== undefined && { dateFormat }),
          ...(theme !== undefined && { theme }),
          ...(roleId !== undefined && { roleId }),
          ...(occupationId !== undefined && { occupationId }),
          ...(currencyId !== undefined && { currencyId }),
          ...(timezoneId !== undefined && { timezoneId }),
          ...(countryId !== undefined && { countryId }),
        },
        select: this.userSelect,
      });

      return {
        user: this.formatUser(updatedUser as UserResponse),
        updated: true,
      };
    });
  }

  archive(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        // include: {
        //   users: {
        //     where: {
        //       deletedAt: null,
        //     },
        //   },
        // },
      });

      if (!existingUser) {
        throw new NotFoundException(`Oops! The user you’re looking for doesn’t exist.`);
      }

      // if (existingUser.users.length > 0) {
      //   throw new ConflictException(`The user you’re trying to archive is currently being used.`);
      // }

      const archivedUser = await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: this.userSelect,
      });

      return this.formatUser(archivedUser as UserResponse);
    });
  }

  async completeOnboarding(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isOnboarded) {
      return { message: 'User already onboarded.' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    return { message: 'Onboarding complete.' };
  }

  private formatUser(user: UserResponse): FormattedUser {
    const phUpdatedTime = toZonedTime(user.updatedAt, this.timezone);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
      isOnboarded: user.isOnboarded,
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
