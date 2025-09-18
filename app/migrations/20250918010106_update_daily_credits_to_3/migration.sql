/*
  Warnings:

  - You are about to drop the column `lemonSqueezyCustomerPortalUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lemonSqueezyCustomerPortalUrl",
ALTER COLUMN "dailyCredits" SET DEFAULT 3;

-- Update existing users who have more than 3 daily credits to 3
UPDATE "User" SET "dailyCredits" = 3 WHERE "dailyCredits" > 3;
