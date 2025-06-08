/*
  Warnings:

  - You are about to drop the column `company` on the `ExperienceEntry` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ExperienceEntry` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `ExperienceEntry` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `ExperienceEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExperienceEntry" DROP COLUMN "company",
DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "role",
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "startDate" TEXT,
ADD COLUMN     "workDescription" TEXT;
