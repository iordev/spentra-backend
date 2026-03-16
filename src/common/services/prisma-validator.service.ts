import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Supported Prisma models for FK existence validation.
 * Add new models here as your app grows.
 */
export type ValidatableModel = 'role' | 'occupation' | 'currency' | 'timezone' | 'country';

export type ValidateIdsInput = Partial<
  Record<ValidatableModel, number | string | undefined | null>
>;

@Injectable()
export class PrismaValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that a single record exists in the DB.
   * Skips validation if id is null or undefined (optional fields).
   */
  async validateId(model: ValidatableModel, id: number | string | undefined | null): Promise<void> {
    if (id == null) return;

    const record = await (this.prisma[model] as any).findUnique({
      where: { id },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException(
        `The selected ${this.formatModelName(model)} is not available or may have been removed.`,
      );
    }
  }

  /**
   * Validates multiple FK IDs in parallel.
   * Pass only the IDs you want to check.
   *
   * @example
   * await this.prismaValidator.validateIds({
   *   role: roleId,
   *   country: countryId,
   * });
   */
  async validateIds(checks: ValidateIdsInput): Promise<void> {
    await Promise.all(
      Object.entries(checks).map(([model, id]) => this.validateId(model as ValidatableModel, id)),
    );
  }

  private formatModelName(model: string): string {
    return model.charAt(0).toUpperCase() + model.slice(1);
  }
}
