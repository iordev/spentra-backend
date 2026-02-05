/*
  Warnings:

  - Added the required column `group` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "group" TEXT NOT NULL,
ALTER COLUMN "description" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "description" DROP DEFAULT;
