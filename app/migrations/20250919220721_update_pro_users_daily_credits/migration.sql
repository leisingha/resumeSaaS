-- Update Pro users to have 100 daily credits
-- Pro users are identified by having a valid subscription status (not null, not 'deleted', not 'past_due')
UPDATE "User"
SET "dailyCredits" = 100,
    "lastCreditReset" = NOW()
WHERE "subscriptionStatus" IS NOT NULL
  AND "subscriptionStatus" != 'deleted'
  AND "subscriptionStatus" != 'past_due';