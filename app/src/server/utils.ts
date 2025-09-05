export function requireNodeEnvVar(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Env var ${name} is undefined`);
  } else {
    return value;
  }
}

// Daily credit management utilities
export function isNewDay(lastReset: Date): boolean {
  const now = new Date();
  const lastResetDate = new Date(lastReset);
  
  // Check if we're on a different day (UTC)
  return (
    now.getUTCFullYear() !== lastResetDate.getUTCFullYear() ||
    now.getUTCMonth() !== lastResetDate.getUTCMonth() ||
    now.getUTCDate() !== lastResetDate.getUTCDate()
  );
}

export async function ensureDailyCredits(userId: string, userDelegate: any): Promise<{ dailyCredits: number; purchasedCredits: number; totalCredits: number }> {
  console.log(`[ensureDailyCredits] Checking credits for user: ${userId}`);
  
  const user = await userDelegate.findUnique({
    where: { id: userId },
    select: { dailyCredits: true, lastCreditReset: true, isAdmin: true, credits: true }
  });

  console.log(`[ensureDailyCredits] User data:`, {
    userId,
    isAdmin: user?.isAdmin,
    dailyCredits: user?.dailyCredits,
    purchasedCredits: user?.credits,
    lastCreditReset: user?.lastCreditReset
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Admin users don't need credit management
  if (user.isAdmin) {
    console.log(`[ensureDailyCredits] Admin user, returning unlimited credits`);
    return { dailyCredits: 999, purchasedCredits: 999, totalCredits: 999 }; // Unlimited for admin
  }

  let dailyCredits = user.dailyCredits;
  const purchasedCredits = user.credits;

  // Check if we need to reset daily credits
  const needsReset = isNewDay(user.lastCreditReset);
  console.log(`[ensureDailyCredits] Needs reset: ${needsReset}, lastReset: ${user.lastCreditReset}`);
  
  if (needsReset) {
    console.log(`[ensureDailyCredits] Resetting daily credits to 10`);
    // Reset to 10 credits for the new day
    const updatedUser = await userDelegate.update({
      where: { id: userId },
      data: {
        dailyCredits: 10,
        lastCreditReset: new Date()
      },
      select: { dailyCredits: true }
    });
    dailyCredits = updatedUser.dailyCredits;
    console.log(`[ensureDailyCredits] Reset complete, new dailyCredits: ${dailyCredits}`);
  }

  const totalCredits = dailyCredits + purchasedCredits;
  console.log(`[ensureDailyCredits] Final credit tally: ${dailyCredits} daily + ${purchasedCredits} purchased = ${totalCredits} total`);
  
  return { dailyCredits, purchasedCredits, totalCredits };
}

export async function consumeCredit(userId: string, userDelegate: any): Promise<{ consumedFrom: 'daily' | 'purchased' }> {
  console.log(`[consumeCredit] Starting credit consumption for user: ${userId}`);
  
  const user = await userDelegate.findUnique({
    where: { id: userId },
    select: { isAdmin: true, dailyCredits: true, credits: true }
  });

  console.log(`[consumeCredit] User data:`, {
    userId,
    isAdmin: user?.isAdmin,
    dailyCredits: user?.dailyCredits,
    purchasedCredits: user?.credits
  });

  // Admin users don't consume credits
  if (user?.isAdmin) {
    console.log(`[consumeCredit] User is admin, skipping credit consumption`);
    return { consumedFrom: 'daily' }; // Doesn't matter for admins
  }

  // Try to consume daily credits first
  if (user?.dailyCredits && user.dailyCredits > 0) {
    console.log(`[consumeCredit] Consuming 1 daily credit (${user.dailyCredits} available)`);
    const result = await userDelegate.update({
      where: { id: userId },
      data: {
        dailyCredits: { decrement: 1 }
      },
      select: { dailyCredits: true, credits: true }
    });
    
    console.log(`[consumeCredit] Consumed daily credit: ${user.dailyCredits} → ${result.dailyCredits}`);
    return { consumedFrom: 'daily' };
  }

  // Fall back to purchased credits if daily credits are exhausted
  if (user?.credits && user.credits > 0) {
    console.log(`[consumeCredit] Daily credits exhausted, consuming 1 purchased credit (${user.credits} available)`);
    const result = await userDelegate.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 }
      },
      select: { dailyCredits: true, credits: true }
    });
    
    console.log(`[consumeCredit] Consumed purchased credit: ${user.credits} → ${result.credits}`);
    return { consumedFrom: 'purchased' };
  }

  // This shouldn't happen if we checked totalCredits properly before calling this function
  throw new Error('No credits available to consume');
}
