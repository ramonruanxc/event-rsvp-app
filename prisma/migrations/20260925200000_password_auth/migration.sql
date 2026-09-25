-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordClearedAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordNotice" BOOLEAN NOT NULL DEFAULT false;
