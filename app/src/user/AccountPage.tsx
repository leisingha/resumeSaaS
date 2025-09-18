import type { User } from "wasp/entities";
import {
  SubscriptionStatus,
  prettyPaymentPlanName,
  parsePaymentPlanId,
} from "../payment/plans";
import {
  getCustomerPortalUrl,
  useQuery,
  getCurrentDailyCredits,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { logout } from "wasp/client/auth";
import { ModernProgress } from "../features/common/ModernProgress";
import StyledButton from "../features/common/StyledButton";

// Helper function to calculate progress percentage safely
function calculateProgress(
  current: number | null | undefined,
  max: number
): number {
  const safeCurrentValue = Number(current) || 0;
  const safeMaxValue = Math.max(max, 1); // Ensure we don't divide by 0
  return Math.max(0, Math.min((safeCurrentValue / safeMaxValue) * 100, 100));
}

export default function AccountPage({ user }: { user: User }) {
  // Get real daily credits from the server
  const {
    data: creditData,
    isLoading: creditsLoading,
    error,
  } = useQuery(getCurrentDailyCredits);

  if (creditsLoading) return <div>Loading account details...</div>;
  if (error) {
    console.error("Error loading credits:", error);
    return <div>Error loading credits: {error.message}</div>;
  }

  // Use real credit data from server
  const accountDetails = {
    ...user,
    dailyCredits: creditData?.dailyCredits ?? 0,
    purchasedCredits: creditData?.purchasedCredits ?? user.credits,
    totalCredits: creditData?.totalCredits ?? user.credits,
    isAdmin: creditData?.isAdmin ?? user.isAdmin,
  };

  return (
    <div className="mt-10 px-6">
      <div className="overflow-hidden border border-gray-900/10 shadow-lg sm:rounded-lg mb-4 lg:m-8 dark:border-gray-100/10">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Account Information
          </h3>
        </div>
        <div className="border-t border-gray-900/10 dark:border-gray-100/10 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-900/10 sm:dark:divide-gray-100/10">
            {!!accountDetails?.email && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-white">
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                  {accountDetails.email}
                </dd>
              </div>
            )}
            {!!accountDetails?.username && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-white">
                  Username
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                  {accountDetails.username}
                </dd>
              </div>
            )}
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6 sm:items-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-white">
                Your Plan
              </dt>
              <UserCurrentPaymentPlan
                subscriptionStatus={
                  accountDetails?.subscriptionStatus as SubscriptionStatus
                }
                subscriptionPlan={accountDetails?.subscriptionPlan}
                datePaid={accountDetails?.datePaid}
                credits={
                  accountDetails?.purchasedCredits ?? accountDetails?.credits
                }
                dailyCredits={accountDetails?.dailyCredits}
                totalCredits={accountDetails?.totalCredits}
                isAdmin={accountDetails?.isAdmin}
              />
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-white">
                About
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-2 sm:mt-0">
                I'm a cool customer.
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="inline-flex w-full justify-end">
        <div
          style={{
            width: "120px",
            transform: "scale(0.7)",
            transformOrigin: "right",
          }}
          className="mx-8"
        >
          <StyledButton onClick={logout} text="Logout" variant="yellow" />
        </div>
      </div>
    </div>
  );
}

type UserCurrentPaymentPlanProps = {
  subscriptionPlan: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  datePaid: Date | null;
  credits: number;
  dailyCredits?: number;
  totalCredits?: number;
  isAdmin?: boolean;
};

function UserCurrentPaymentPlan({
  subscriptionPlan,
  subscriptionStatus,
  datePaid,
  credits,
  dailyCredits,
  totalCredits,
  isAdmin,
}: UserCurrentPaymentPlanProps) {
  // Determine if user is Pro/subscribed
  const hasValidSubscription =
    !!subscriptionStatus &&
    subscriptionStatus !== SubscriptionStatus.Deleted &&
    subscriptionStatus !== SubscriptionStatus.PastDue;

  const maxDailyCredits = hasValidSubscription ? 100 : 3;

  if (subscriptionStatus && subscriptionPlan && datePaid) {
    return (
      <>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-1 sm:mt-0">
          <div className="space-y-2">
            <div>
              {getUserSubscriptionStatusDescription({
                subscriptionPlan,
                subscriptionStatus,
                datePaid,
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-400 dark:text-gray-300">
                Credits Available:
              </span>
              <span className="text-sm">{totalCredits ?? 0}</span>
              <ModernProgress
                value={calculateProgress(dailyCredits, maxDailyCredits)}
                size="sm"
                variant="circular"
                showLabel={false}
                color="bg-gradient-to-r from-green-400 to-green-600"
              />
              <span className="text-xs text-gray-500 ml-2">
                Daily: {dailyCredits ?? 0}/{maxDailyCredits}
              </span>
              {credits && credits > 0 && (
                <span className="text-xs text-blue-500 ml-2">
                  + {credits} purchased
                </span>
              )}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              ✨ Pro benefit: AI Writer costs no credits!
            </div>
            {isAdmin && (
              <div className="text-xs text-blue-500 font-semibold">
                ⚡ ADMIN: Unlimited credits
              </div>
            )}
          </div>
        </dd>
        {subscriptionStatus !== SubscriptionStatus.Deleted && (
          <CustomerPortalButton />
        )}
      </>
    );
  }

  return (
    <>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400 sm:col-span-1 sm:mt-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-400 dark:text-gray-300">
            Credits Available:
          </span>
          <span className="text-sm">{dailyCredits ?? 0}/3</span>
          <ModernProgress
            value={calculateProgress(dailyCredits, 3)}
            size="sm"
            variant="circular"
            showLabel={false}
            color="bg-gradient-to-r from-green-400 to-green-600"
          />
          <span className="text-xs text-gray-500 ml-2">Resets daily</span>
        </div>
        {isAdmin && (
          <div className="pt-1 mt-2">
            <span className="text-xs text-blue-500 font-semibold">
              ⚡ ADMIN: Unlimited credits
            </span>
          </div>
        )}
      </dd>
    </>
  );
}

function getUserSubscriptionStatusDescription({
  subscriptionPlan,
  subscriptionStatus,
  datePaid,
}: {
  subscriptionPlan: string;
  subscriptionStatus: SubscriptionStatus;
  datePaid: Date;
}) {
  const planName = prettyPaymentPlanName(parsePaymentPlanId(subscriptionPlan));
  const endOfBillingPeriod = prettyPrintEndOfBillingPeriod(datePaid);
  return prettyPrintStatus(planName, subscriptionStatus, endOfBillingPeriod);
}

function prettyPrintStatus(
  planName: string,
  subscriptionStatus: SubscriptionStatus,
  endOfBillingPeriod: string
): string {
  const statusToMessage: Record<SubscriptionStatus, string> = {
    active: `${planName}`,
    past_due: `Payment for your ${planName} plan is past due! Please update your subscription payment information.`,
    cancel_at_period_end: `Your ${planName} plan subscription has been canceled, but remains active until the end of the current billing period${endOfBillingPeriod}`,
    deleted: `Your previous subscription has been canceled and is no longer active.`,
  };
  if (Object.keys(statusToMessage).includes(subscriptionStatus)) {
    return statusToMessage[subscriptionStatus];
  } else {
    throw new Error(`Invalid subscriptionStatus: ${subscriptionStatus}`);
  }
}

function prettyPrintEndOfBillingPeriod(date: Date) {
  const oneMonthFromNow = new Date(date);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  return ": " + oneMonthFromNow.toLocaleDateString();
}

function CustomerPortalButton() {
  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl);

  const handleClick = () => {
    if (customerPortalUrlError) {
      console.error("Error fetching customer portal url");
    }

    if (customerPortalUrl) {
      window.open(customerPortalUrl, "_blank");
    } else {
      console.error("Customer portal URL is not available");
    }
  };

  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      <button
        onClick={handleClick}
        disabled={isCustomerPortalUrlLoading}
        className="font-medium text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Manage Subscription
      </button>
    </div>
  );
}
