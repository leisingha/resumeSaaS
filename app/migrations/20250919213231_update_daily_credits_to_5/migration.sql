-- Update daily credits default from 3 to 5
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "dailyCredits" SET DEFAULT 5;

-- Update existing users to have 5 daily credits (only increase, don't decrease)
UPDATE "User" SET "dailyCredits" = 5 WHERE "dailyCredits" < 5;