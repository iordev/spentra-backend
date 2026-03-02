// src/modules/v1/roles/helpers/validate-permissions.helper.ts
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export async function validatePermissions(
  tx: Prisma.TransactionClient,
  permissions: number[],
): Promise<void> {
  const uniquePermissions = [...new Set(permissions)];
  if (uniquePermissions.length !== permissions.length) {
    throw new ConflictException('Permission IDs must be unique');
  }

  const existingPermissions = await tx.permission.findMany({
    where: { id: { in: permissions } },
    select: { id: true },
  });

  const existingIds = existingPermissions.map((p) => p.id);
  const missingIds = permissions.filter((id) => !existingIds.includes(id));

  if (missingIds.length > 0) {
    throw new NotFoundException(`Permission not found!`);
  }
}
