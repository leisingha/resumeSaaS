/*
  Warnings:

  - You are about to drop the column `fullName` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `professionalSummary` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "fullName",
DROP COLUMN "professionalSummary",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
