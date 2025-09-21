import { useAuth } from "wasp/client/auth";
import {
  generateCheckoutSession,
  getCustomerPortalUrl,
  useQuery,
} from "wasp/client/operations";
import {
  PaymentPlanId,
  paymentPlans,
  prettyPaymentPlanName,
  SubscriptionStatus,
} from "./plans";
import { AiFillCheckCircle } from "react-icons/ai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../client/cn";
import StyledButton from "../features/common/StyledButton";

type PricingPagePlanId = Exclude<PaymentPlanId, PaymentPlanId.ResumeReview | PaymentPlanId.ResumeWriting>;

const bestDealPaymentPlanId: PricingPagePlanId = PaymentPlanId.Pro;

interface PaymentPlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const paymentPlanCards: Record<PricingPagePlanId, PaymentPlanCard> = {
  [PaymentPlanId.Hobby]: {
    name: prettyPaymentPlanName(PaymentPlanId.Hobby),
    price: "$0",
    description: "All you need to get started",
    features: ["5 AI credits per day"],
  },
  [PaymentPlanId.Pro]: {
    name: prettyPaymentPlanName(PaymentPlanId.Pro),
    price: "14.99",
    description: "Our most popular plan",
    features: [
      "100 AI credits per day",
      "Unlimited AI editor usage",
      "1 free Resume review per month",
    ],
  },
  [PaymentPlanId.Credits10]: {
    name: "Credit Pack",
    price: "4.99",
    description: "No subscriptions. Just credits when you need them",
    features: ["50 AI credits", "Limited AI editor usage"],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user, isLoading: isAuthLoading, error: authError } = useAuth();

  // Only consider user subscribed if they are authenticated and have a valid subscription status
  const isUserSubscribed =
    !!user &&
    !isAuthLoading &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted;

  // Additional safety check to ensure user is fully authenticated
  const isUserFullyAuthenticated = !!user && !isAuthLoading && !authError;

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl, {
    enabled: isUserSubscribed && isUserFullyAuthenticated,
    retry: false, // Don't retry on auth errors
    onError: (error: unknown) => {
      console.error("Customer portal URL query error:", error);
      // If it's an auth error, don't show it to the user as it will be handled by the auth error handler
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 401
      ) {
        console.log(
          "Auth error detected in customer portal query, redirecting to login"
        );
      }
    },
  });

  const navigate = useNavigate();

  // Handle auth errors by redirecting to login
  if (authError && !isAuthLoading) {
    console.log("Auth error detected, redirecting to login");
    // Redirect to login if there's an auth error
    navigate("/login");
    return null;
  }

  // Handle customer portal query auth errors
  if (
    customerPortalUrlError &&
    typeof customerPortalUrlError === "object" &&
    "status" in customerPortalUrlError &&
    customerPortalUrlError.status === 401
  ) {
    console.log("Customer portal query auth error, redirecting to login");
    navigate("/login");
    return null;
  }

  async function handleBuyNowClick(paymentPlanId: PricingPagePlanId) {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession(paymentPlanId);

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Error processing payment. Please try again later.");
      }
      setIsPaymentLoading(false); // We only set this to false here and not in the try block because we redirect to the checkout url within the same window
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (customerPortalUrlError) {
      setErrorMessage("Error fetching Customer Portal URL");
      return;
    }

    if (!customerPortalUrl) {
      setErrorMessage(`Customer Portal does not exist for user ${user.id}`);
      return;
    }

    window.open(customerPortalUrl, "_blank");
  };

  // Show loading state while auth is being determined
  if (isAuthLoading) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-white">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging to help identify issues
  console.log("PricingPage render state:", {
    user: !!user,
    isAuthLoading,
    authError: !!authError,
    isUserSubscribed,
    customerPortalUrlError: !!customerPortalUrlError,
  });

  return (
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div id="pricing" className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Start Applify for{" "}
            <span className="italic bg-gradient-to-r from-[#d946ef] to-[#fc0] bg-clip-text text-transparent px-1">
              free
            </span>
          </h2>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-white">
          Unlock more AI credits, advanced editing tools, and monthly resume
          reviews to maximize your job search success.
        </p>
        {errorMessage && (
          <div className="mt-8 p-4 bg-red-100 text-red-600 rounded-md dark:bg-red-200 dark:text-red-800">
            {errorMessage}
          </div>
        )}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:gap-x-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {(Object.keys(paymentPlanCards) as PricingPagePlanId[]).map((planId) => (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col grow justify-between rounded-3xl ring-gray-900/10 dark:ring-gray-100/10 overflow-hidden p-8 xl:p-10",
                {
                  "ring-2": planId === bestDealPaymentPlanId,
                  "ring-1 lg:mt-8": planId !== bestDealPaymentPlanId,
                }
              )}
              style={{
                boxShadow:
                  "rgba(240, 46, 170, 0.4) 5px 5px, rgba(240, 46, 170, 0.3) 10px 10px, rgba(240, 46, 170, 0.2) 15px 15px, rgba(240, 46, 170, 0.1) 20px 20px, rgba(240, 46, 170, 0.05) 25px 25px",
              }}
            >
              {planId === bestDealPaymentPlanId && (
                <div
                  className="absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl"
                  aria-hidden="true"
                >
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-amber-400 to-purple-300 opacity-30 dark:opacity-50"
                    style={{
                      clipPath: "circle(670% at 50% 50%)",
                    }}
                  />
                </div>
              )}
              <div className="mb-8">
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={planId}
                    className="text-gray-900 text-lg font-semibold leading-8 dark:text-white"
                  >
                    {paymentPlanCards[planId].name}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-white">
                  {paymentPlanCards[planId].description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1 dark:text-white">
                  <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {paymentPlanCards[planId].price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-white">
                    {paymentPlans[planId].effect.kind === "subscription" &&
                      "/month"}
                  </span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-white"
                >
                  {paymentPlanCards[planId].features.map((feature: string) => (
                    <li key={feature} className="flex gap-x-3">
                      <AiFillCheckCircle
                        className="h-6 w-5 flex-none text-yellow-500"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {isUserSubscribed ? (
                <button
                  onClick={planId === PaymentPlanId.Credits10 ? () => handleBuyNowClick(planId) : handleCustomerPortalClick}
                  disabled={planId === PaymentPlanId.Credits10 ? isPaymentLoading : isCustomerPortalUrlLoading}
                  className="w-full rounded-md text-white py-3 px-6 transition-all duration-150 hover:transform hover:-translate-x-1 hover:-translate-y-1 active:transform active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none mt-8"
                  style={{
                    background: planId === PaymentPlanId.Pro ? "transparent" : "#1A222C",
                    fontWeight: 900,
                    fontSize: "16px",
                    border: "3px solid #fbca1f",
                    borderRadius: "0.4em",
                    boxShadow: "0.1em 0.1em #fbca1f",
                    cursor: (planId === PaymentPlanId.Credits10 ? isPaymentLoading : isCustomerPortalUrlLoading)
                      ? "not-allowed"
                      : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!(planId === PaymentPlanId.Credits10 ? isPaymentLoading : isCustomerPortalUrlLoading)) {
                      e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0.1em 0.1em #fbca1f";
                  }}
                  onMouseDown={(e) => {
                    if (!(planId === PaymentPlanId.Credits10 ? isPaymentLoading : isCustomerPortalUrlLoading)) {
                      e.currentTarget.style.boxShadow = "0.05em 0.05em #fbca1f";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!(planId === PaymentPlanId.Credits10 ? isPaymentLoading : isCustomerPortalUrlLoading)) {
                      e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                    }
                  }}
                >
                  {planId === PaymentPlanId.Credits10 ? (
                    isPaymentLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Loading...
                      </div>
                    ) : (
                      "Buy Credits"
                    )
                  ) : (
                    isCustomerPortalUrlLoading
                      ? "Loading..."
                      : "Manage Subscription"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (planId === PaymentPlanId.Hobby) {
                      // For Free plan, navigate to main app
                      navigate("/");
                    } else {
                      handleBuyNowClick(planId);
                    }
                  }}
                  disabled={isPaymentLoading}
                  className="w-full rounded-md text-white py-3 px-6 transition-all duration-150 hover:transform hover:-translate-x-1 hover:-translate-y-1 active:transform active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none mt-8"
                  style={{
                    background: "transparent",
                    fontWeight: 900,
                    fontSize: "16px",
                    border: "3px solid #fbca1f",
                    borderRadius: "0.4em",
                    boxShadow: "0.1em 0.1em #fbca1f",
                    cursor: isPaymentLoading ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPaymentLoading) {
                      e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0.1em 0.1em #fbca1f";
                  }}
                  onMouseDown={(e) => {
                    if (!isPaymentLoading) {
                      e.currentTarget.style.boxShadow = "0.05em 0.05em #fbca1f";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isPaymentLoading) {
                      e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                    }
                  }}
                >
                  {isPaymentLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Loading...
                    </div>
                  ) : planId === PaymentPlanId.Hobby ? (
                    "Get Started"
                  ) : planId === PaymentPlanId.Credits10 ? (
                    "Buy Credits"
                  ) : !!user ? (
                    "Buy plan"
                  ) : (
                    "Log in to buy plan"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
