/*
  Warnings:

  - You are about to drop the `EducationEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExperienceEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EducationEntry" DROP CONSTRAINT "EducationEntry_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "ExperienceEntry" DROP CONSTRAINT "ExperienceEntry_userProfileId_fkey";

-- DropTable
DROP TABLE "EducationEntry";

-- DropTable
DROP TABLE "ExperienceEntry";
