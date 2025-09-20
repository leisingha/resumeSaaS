-- CreateTable
CREATE TABLE "ResumeServiceRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeFocusAreas" JSONB NOT NULL,
    "jobTitles" JSONB NOT NULL,
    "experience" TEXT,
    "additionalInfo" TEXT,
    "resumeFileKey" TEXT,
    "resumeFileName" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "requestStatus" TEXT NOT NULL DEFAULT 'submitted',
    "userId" TEXT,

    CONSTRAINT "ResumeServiceRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResumeServiceRequest" ADD CONSTRAINT "ResumeServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
