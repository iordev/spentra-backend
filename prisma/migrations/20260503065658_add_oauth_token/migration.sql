-- AlterTable
ALTER TABLE "User" ADD COLUMN     "oauthToken" TEXT,
ADD COLUMN     "oauthTokenExpiry" TIMESTAMP(3);
