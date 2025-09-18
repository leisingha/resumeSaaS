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
import { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  CreditCard, 
  Shield, 
  Settings, 
  Key,
  Crown,
  Calendar,
  LogOut
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<'account' | 'password'>('account');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get real daily credits from the server
  const {
    data: creditData,
    isLoading: creditsLoading,
    error,
  } = useQuery(getCurrentDailyCredits);

  if (creditsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading credits:", error);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600">Error loading account details: {error.message}</div>
      </div>
    );
  }

  // Use real credit data from server
  const accountDetails = {
    ...user,
    dailyCredits: creditData?.dailyCredits ?? 0,
    purchasedCredits: creditData?.purchasedCredits ?? user.credits,
    totalCredits: creditData?.totalCredits ?? user.credits,
    isAdmin: creditData?.isAdmin ?? user.isAdmin,
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    
    // TODO: Implement password change logic
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Show success message
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('account')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'account'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                Account Settings
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'password'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key size={16} />
                Password & Security
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {activeTab === 'account' ? (
            <AccountSettingsTab accountDetails={accountDetails} />
          ) : (
            <PasswordTab 
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              isChangingPassword={isChangingPassword}
              onPasswordChange={handlePasswordChange}
            />
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md font-medium text-sm transition-colors dark:border-red-600 dark:text-red-400 dark:bg-gray-800 dark:hover:bg-red-900/20"
          >
            <LogOut size={16} />
            Sign Out
          </button>
      </div>
    </div>
  );
}

// Account Settings Tab Component
function AccountSettingsTab({ accountDetails }: { accountDetails: any }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6">
        {/* User Information Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountDetails?.username && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <UserIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
                  <p className="text-sm text-gray-900 dark:text-white">{accountDetails.username}</p>
                </div>
              </div>
            )}
            {accountDetails?.email && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Mail size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white">{accountDetails.email}</p>
                </div>
              </div>
            )}
            {accountDetails?.datePaid && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(accountDetails.datePaid).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {accountDetails?.isAdmin && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Crown size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Administrator</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription & Credits Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <CreditCard size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscription & Credits
            </h3>
          </div>
          
          <UserCurrentPaymentPlan
            subscriptionStatus={accountDetails?.subscriptionStatus as SubscriptionStatus}
            subscriptionPlan={accountDetails?.subscriptionPlan}
            datePaid={accountDetails?.datePaid}
            credits={accountDetails?.purchasedCredits ?? accountDetails?.credits}
            dailyCredits={accountDetails?.dailyCredits}
            totalCredits={accountDetails?.totalCredits}
            isAdmin={accountDetails?.isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

// Password Tab Component
function PasswordTab({ 
  passwordForm, 
  setPasswordForm, 
  isChangingPassword, 
  onPasswordChange 
}: {
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: (form: any) => void;
  isChangingPassword: boolean;
  onPasswordChange: (e: React.FormEvent) => void;
}) {
  const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword;
  const isFormValid = passwordForm.currentPassword && 
                     passwordForm.newPassword && 
                     passwordForm.confirmPassword && 
                     passwordsMatch &&
                     passwordForm.newPassword.length >= 8;

  return (
    <div className="p-6">
      <div className="max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change Password
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keep your account secure with a strong password
            </p>
          </div>
        </div>

        <form onSubmit={onPasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter new password (min. 8 characters)"
              minLength={8}
              required
            />
            {passwordForm.newPassword && passwordForm.newPassword.length < 8 && (
              <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters long</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Confirm your new password"
              required
            />
            {passwordForm.confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isChangingPassword}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isChangingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating Password...
                </>
              ) : (
                <>
                  <Key size={16} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>

        {/* Password Requirements */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Password Requirements:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Mix of uppercase and lowercase letters (recommended)</li>
            <li>• Include numbers and special characters (recommended)</li>
            <li>• Avoid common words or personal information</li>
          </ul>
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
        {/* Subscription Status */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Crown size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Current Plan
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getUserSubscriptionStatusDescription({
                  subscriptionPlan,
                  subscriptionStatus,
                  datePaid,
                })}
              </p>
            </div>
          </div>
          
          {subscriptionStatus !== SubscriptionStatus.Deleted && (
            <div className="flex justify-end">
              <CustomerPortalButton />
            </div>
          )}
        </div>

        {/* Credits Information */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Available Credits
            </h4>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {totalCredits ?? 0}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Daily Credits
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {dailyCredits ?? 0}/{maxDailyCredits}
                </span>
                <ModernProgress
                  value={calculateProgress(dailyCredits, maxDailyCredits)}
                  size="sm"
                  variant="circular"
                  showLabel={false}
                  color="bg-gradient-to-r from-green-400 to-green-600"
                />
              </div>
            </div>
            
            {credits && credits > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Purchased Credits
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  +{credits}
                </span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  ✨
                </div>
                Pro benefit: AI Writer costs no credits!
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  ⚡
                </div>
                ADMIN: Unlimited credits
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Available Credits
        </h4>
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {totalCredits ?? dailyCredits ?? 0}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Daily Credits
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {dailyCredits ?? 0}/3
            </span>
            <ModernProgress
              value={calculateProgress(totalCredits ?? dailyCredits ?? 0, 3 + (credits || 0))}
              size="sm"
              variant="circular"
              showLabel={false}
              color="bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
        </div>
        
        {credits && credits > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Purchased Credits
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              +{credits}
            </span>
          </div>
        )}
        
        {isAdmin && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                ⚡
              </div>
              ADMIN: Unlimited credits
            </div>
          </div>
        )}
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
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
    >
      <Settings size={14} />
      Manage Subscription
    </button>
  );
}
