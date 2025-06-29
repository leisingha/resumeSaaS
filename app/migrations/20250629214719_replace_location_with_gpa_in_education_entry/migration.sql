-- DropForeignKey
ALTER TABLE "EducationEntry" DROP CONSTRAINT "EducationEntry_userProfileId_fkey";

-- AddForeignKey
ALTER TABLE "EducationEntry" ADD CONSTRAINT "EducationEntry_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
