/*
  Warnings:

  - You are about to drop the column `location` on the `EducationEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EducationEntry" DROP CONSTRAINT "EducationEntry_userProfileId_fkey";

-- AlterTable
ALTER TABLE "EducationEntry" DROP COLUMN "location",
ADD COLUMN     "gpa" TEXT;

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
