/*
  Warnings:

  - You are about to drop the column `degree` on the `EducationEntry` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `EducationEntry` table. All the data in the column will be lost.
  - You are about to drop the column `institution` on the `EducationEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EducationEntry" DROP COLUMN "degree",
DROP COLUMN "graduationYear",
DROP COLUMN "institution",
ADD COLUMN     "achievements" TEXT,
ADD COLUMN     "fieldOfStudy" TEXT,
ADD COLUMN     "graduationDate" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "school" TEXT;
