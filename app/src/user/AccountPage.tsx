import type { User } from "wasp/entities";
import {
  SubscriptionStatus,
  prettyPaymentPlanName,
  parsePaymentPlanId,
  PaymentPlanId,
} from "../payment/plans";
import {
  getCustomerPortalUrl,
  useQuery,
  getCurrentDailyCredits,
  useAction,
  updateUserProfile,
  generateCheckoutSession,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { logout } from "wasp/client/auth";
import { ModernProgress } from "../features/common/ModernProgress";
import StyledButton from "../features/common/StyledButton";
import { useState, FormEvent, useEffect } from "react";
import toast from "react-hot-toast";

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
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
  });

  // Get real daily credits from the server
  const {
    data: creditData,
    isLoading: creditsLoading,
    error,
  } = useQuery(getCurrentDailyCredits);

  // Update user profile action - will be enabled once types are generated
  const updateUserProfileAction = useAction(updateUserProfile);

  // Initialize form data when component mounts or user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateUserProfileAction(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Optionally refresh the page data here
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle edit mode toggle
  const handleEdit = () => {
    setIsEditing(true);
    // Reset form data to current user data
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
    });
  };

  // Handle cancel edit
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original user data
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
    });
  };

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
      <div className="mx-auto max-w-270">
        <div className="grid grid-cols-5 gap-8">
          {/* Account Information Column */}
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-black dark:text-white">
                    Account Information
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="p-2 text-white hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Edit Profile"
                    >
                      <svg
                        className="fill-white"
                        width="24"
                        height="24"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.8" clipPath="url(#clip0_88_10224)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M1.56524 3.23223C2.03408 2.76339 2.66997 2.5 3.33301 2.5H9.16634C9.62658 2.5 9.99967 2.8731 9.99967 3.33333C9.99967 3.79357 9.62658 4.16667 9.16634 4.16667H3.33301C3.11199 4.16667 2.90003 4.25446 2.74375 4.41074C2.58747 4.56702 2.49967 4.77899 2.49967 5V16.6667C2.49967 16.8877 2.58747 17.0996 2.74375 17.2559C2.90003 17.4122 3.11199 17.5 3.33301 17.5H14.9997C15.2207 17.5 15.4326 17.4122 15.5889 17.2559C15.7452 17.0996 15.833 16.8877 15.833 16.6667V10.8333C15.833 10.3731 16.2061 10 16.6663 10C17.1266 10 17.4997 10.3731 17.4997 10.8333V16.6667C17.4997 17.3297 17.2363 17.9656 16.7674 18.4344C16.2986 18.9033 15.6627 19.1667 14.9997 19.1667H3.33301C2.66997 19.1667 2.03408 18.9033 1.56524 18.4344C1.0964 17.9656 0.833008 17.3297 0.833008 16.6667V5C0.833008 4.33696 1.0964 3.70107 1.56524 3.23223Z"
                            fill=""
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.6664 2.39884C16.4185 2.39884 16.1809 2.49729 16.0056 2.67253L8.25216 10.426L7.81167 12.188L9.57365 11.7475L17.3271 3.99402C17.5023 3.81878 17.6008 3.5811 17.6008 3.33328C17.6008 3.08545 17.5023 2.84777 17.3271 2.67253C17.1519 2.49729 16.9142 2.39884 16.6664 2.39884ZM14.8271 1.49402C15.3149 1.00622 15.9765 0.732178 16.6664 0.732178C17.3562 0.732178 18.0178 1.00622 18.5056 1.49402C18.9934 1.98182 19.2675 2.64342 19.2675 3.33328C19.2675 4.02313 18.9934 4.68473 18.5056 5.17253L10.5889 13.0892C10.4821 13.196 10.3483 13.2718 10.2018 13.3084L6.86847 14.1417C6.58449 14.2127 6.28409 14.1295 6.0771 13.9225C5.87012 13.7156 5.78691 13.4151 5.85791 13.1312L6.69124 9.79783C6.72787 9.65131 6.80364 9.51749 6.91044 9.41069L14.8271 1.49402Z"
                            fill=""
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_88_10224">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        First Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        placeholder="First Name"
                        value={
                          isEditing
                            ? formData.firstName
                            : accountDetails?.firstName || ""
                        }
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        readOnly={!isEditing}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Last Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        placeholder="Last Name"
                        value={
                          isEditing
                            ? formData.lastName
                            : accountDetails?.lastName || ""
                        }
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Phone Number
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      placeholder="Phone Number"
                      value={
                        isEditing
                          ? formData.phoneNumber
                          : accountDetails?.phoneNumber || ""
                      }
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Email Address
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="email"
                      placeholder="Email Address"
                      value={accountDetails?.email || ""}
                      readOnly
                    />
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Username
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      placeholder="Username"
                      value={
                        isEditing
                          ? formData.username
                          : accountDetails?.username || ""
                      }
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end">
                      <div
                        style={{
                          width: "100px",
                          transform: "scale(0.7)",
                          transformOrigin: "right",
                        }}
                      >
                        <StyledButton
                          onClick={() => {
                            const event = {
                              preventDefault: () => {},
                            } as FormEvent<HTMLFormElement>;
                            handleSubmit(event);
                          }}
                          text="Save"
                          variant="gradient"
                        />
                      </div>
                      <div
                        style={{
                          width: "100px",
                          transform: "scale(0.7)",
                          transformOrigin: "right",
                          marginLeft: "-20px",
                        }}
                      >
                        <StyledButton
                          onClick={handleCancel}
                          text="Cancel"
                          variant="secondary"
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Plan Details Column */}
          <div className="col-span-5 xl:col-span-2">
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Plan Details
                </h3>
              </div>
              <div className="p-7">
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
            </div>

            {/* Change Password Container */}
            <div className="mt-6">
              <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Change Password
                  </h3>
                </div>
                <div className="p-7">
                  <div className="mb-4">
                    <p className="text-sm text-gray-900 dark:text-gray-400">
                      Request a password reset link to be sent to your email
                      address.
                    </p>
                  </div>
                  <div
                    style={{
                      transform: "scale(0.7)",
                      transformOrigin: "left",
                    }}
                  >
                    <StyledButton
                      onClick={() => {
                        window.open(
                          routes.RequestPasswordResetRoute.to,
                          "_blank"
                        );
                      }}
                      text="Send password reset email"
                      variant="gradient"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Current Plan
          </label>
          <div className="text-sm text-gray-900 dark:text-gray-400">
            {getUserSubscriptionStatusDescription({
              subscriptionPlan,
              subscriptionStatus,
              datePaid,
            })}
          </div>
          <div className="mt-3">
            <ManageSubscriptionButton />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Credits Available
          </label>
          <div className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✨ Pro benefit: AI Writer costs no credits!
          </div>
          {isAdmin && (
            <div className="text-xs text-blue-500 font-semibold mt-1">
              ⚡ ADMIN: Unlimited credits
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-black dark:text-white">
              Daily Credits
            </span>
            <span className="text-sm font-bold text-black dark:text-white">
              {totalCredits ?? 0}
            </span>
          </div>
          <ModernProgress
            value={calculateProgress(
              totalCredits,
              maxDailyCredits + (credits || 0)
            )}
            size="lg"
            variant="linear"
            showLabel={false}
            color="bg-gradient-to-r from-violet-500 to-cyan-500"
          />
          <div className="mt-3">
            <BuyMoreCreditsButton />
          </div>
        </div>

        {subscriptionStatus !== SubscriptionStatus.Deleted && (
          <div className="pt-2">
            <CustomerPortalButton />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
          Current Plan
        </label>
        <div className="text-sm text-gray-900 dark:text-gray-400">
          Free Plan
        </div>
        <div className="mt-3">
          <ManageSubscriptionButton />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
          Credits Available
        </label>
        {isAdmin && (
          <div className="text-xs text-blue-500 font-semibold mt-2">
            ⚡ ADMIN: Unlimited credits
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-black dark:text-white">
            Daily Credits
          </span>
          <span className="text-sm font-bold text-black dark:text-white">
            {totalCredits ?? dailyCredits ?? 0}
          </span>
        </div>
        <ModernProgress
          value={calculateProgress(
            totalCredits ?? dailyCredits ?? 0,
            3 + (credits || 0)
          )}
          size="lg"
          variant="linear"
          showLabel={false}
          color="bg-gradient-to-r from-violet-500 to-cyan-500"
        />
        <div className="mt-3">
          <BuyMoreCreditsButton />
        </div>
      </div>
    </div>
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
    <button
      onClick={handleClick}
      disabled={isCustomerPortalUrlLoading}
      className="w-full rounded border border-stroke py-2 px-4 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white text-sm"
    >
      Manage Subscription
    </button>
  );
}

function ManageSubscriptionButton() {
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
    <div
      style={{
        transform: "scale(0.7)",
        transformOrigin: "left",
      }}
    >
      <StyledButton
        onClick={handleClick}
        text={isCustomerPortalUrlLoading ? "Loading..." : "Manage subscription"}
        variant="gradient"
      />
    </div>
  );
}

function BuyMoreCreditsButton() {
  const generateCheckoutSessionAction = useAction(generateCheckoutSession);

  const handleClick = async () => {
    try {
      const checkoutResults = await generateCheckoutSessionAction(
        PaymentPlanId.Credits10
      );
      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      }
    } catch (error) {
      console.error("Error generating checkout session:", error);
      toast.error("Failed to start checkout process");
    }
  };

  return (
    <div
      style={{
        transform: "scale(0.7)",
        transformOrigin: "left",
      }}
    >
      <StyledButton
        onClick={handleClick}
        text="Buy more credits"
        variant="gradient"
      />
    </div>
  );
}
