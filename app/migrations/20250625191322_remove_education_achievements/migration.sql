/*
  Warnings:

  - You are about to drop the column `achievements` on the `EducationEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EducationEntry" DROP CONSTRAINT "EducationEntry_userProfileId_fkey";

-- AlterTable
ALTER TABLE "EducationEntry" DROP COLUMN "achievements";

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
