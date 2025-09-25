import { Link as ReactRouterLink } from "react-router-dom";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useAuth } from "wasp/client/auth";
import { useState, Dispatch, SetStateAction } from "react";
import { BiLogIn } from "react-icons/bi";
import logo from "../../static/logo.webp";
import DropdownUser from "../../../user/DropdownUser";
import { UserMenuItems } from "../../../user/UserMenuItems";
import DarkModeSwitcher from "../DarkModeSwitcher";
import { useIsLandingPage } from "../../hooks/useIsLandingPage";
import { cn } from "../../cn";

export interface NavigationItem {
  name: string;
  to: string;
}

const NavLogo = () => (
  <span className="text-2xl font-bold text-gray-900 dark:text-white">
    Applify
  </span>
);

// Animated Hamburger Icon Component
const HamburgerIcon = ({
  className,
  isOpen,
  ...props
}: React.SVGAttributes<SVGElement> & { isOpen?: boolean }) => (
  <svg
    className={cn("transition-transform duration-300", className)}
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Top line - transforms to top part of X */}
    <path
      d="M4 12L20 12"
      className={cn(
        "origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]",
        isOpen && "translate-x-0 translate-y-0 rotate-[315deg]"
      )}
    />
    {/* Middle line - becomes the center of X */}
    <path
      d="M4 12H20"
      className={cn(
        "origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)]",
        isOpen && "rotate-45"
      )}
    />
    {/* Bottom line - transforms to bottom part of X */}
    <path
      d="M4 12H20"
      className={cn(
        "origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]",
        isOpen && "translate-y-0 rotate-[135deg]"
      )}
    />
  </svg>
);

// Mobile Menu Component - Popover style floating card
const MobileMenu = ({
  navigationItems,
  user,
  isUserLoading,
  isOpen,
  onClose,
}: {
  navigationItems: NavigationItem[];
  user: any;
  isUserLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose} />
      {/* Floating Menu Card */}
      <div
        className={cn(
          "absolute top-18 right-4 z-50 lg:hidden",
          "w-40 bg-white dark:bg-boxdark-2",
          "border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl",
          "transform transition-all duration-200 ease-out",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <div className="p-2">
          {/* Navigation Items */}
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <ReactRouterLink
                key={item.name}
                to={item.to}
                className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                onClick={onClose}
              >
                {item.name}
              </ReactRouterLink>
            ))}
          </div>

          {/* Dark Mode Switcher */}
          <div className="px-1">
            <DarkModeSwitcher />
          </div>
        </div>
      </div>
    </>
  );
};

export default function AppNavBar({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = useIsLandingPage();

  const { data: user, isLoading: isUserLoading } = useAuth();

  // Determine where the logo should link to
  const logoLinkTo =
    user && !isLandingPage
      ? routes.MainAppRoute.to
      : routes.LandingPageRoute.to;

  return (
    <header
      className={cn("absolute inset-x-0 top-0 z-50", {
        "sticky bg-white bg-opacity-50 backdrop-blur-lg backdrop-filter dark:bg-boxdark-2":
          !isLandingPage,
        "bg-transparent": isLandingPage,
      })}
    >
      {isLandingPage && <Announcement />}
      <nav
        className="flex items-center justify-between p-6 lg:py-6 mx-auto max-w-6xl relative"
        aria-label="Global"
      >
        <div className="flex items-center lg:flex-1">
          <WaspRouterLink
            to={logoLinkTo}
            className="flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-yellow-500"
          >
            <NavLogo />
          </WaspRouterLink>
        </div>

        <div className="flex lg:hidden items-center gap-3">
          {/* Log in button for mobile */}
          {isUserLoading ? null : !user ? (
            <WaspRouterLink
              to={routes.LoginRoute.to}
              className="text-sm font-semibold leading-6"
            >
              <div className="flex items-center duration-300 ease-in-out text-gray-900 hover:text-yellow-500 dark:text-white">
                Log in <BiLogIn size="1.1rem" className="ml-1 mt-[0.1rem]" />
              </div>
            </WaspRouterLink>
          ) : (
            <DropdownUser user={user} />
          )}

          {/* Hamburger menu button */}
          <button
            type="button"
            className={cn(
              "-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-white",
              "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer",
              "group",
              // Active state when menu is open
              mobileMenuOpen && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Toggle main menu</span>
            <HamburgerIcon
              className="h-6 w-6"
              isOpen={mobileMenuOpen}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-6 lg:justify-end lg:items-center">
          {renderNavigationItems(navigationItems)}
          <DarkModeSwitcher />
          {isUserLoading ? null : !user ? (
            <WaspRouterLink
              to={routes.LoginRoute.to}
              className="text-sm font-semibold leading-6"
            >
              <div className="flex items-center duration-300 ease-in-out text-gray-900 hover:text-yellow-500 dark:text-white">
                Log in <BiLogIn size="1.1rem" className="ml-1 mt-[0.1rem]" />
              </div>
            </WaspRouterLink>
          ) : (
            <DropdownUser user={user} />
          )}
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          navigationItems={navigationItems}
          user={user}
          isUserLoading={isUserLoading}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </nav>
    </header>
  );
}

function renderNavigationItems(
  navigationItems: NavigationItem[],
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>
) {
  const menuStyles = cn({
    "-mx-3 block rounded-lg px-3 py-2 text-xl font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-boxdark-2 tracking-wider":
      !!setMobileMenuOpen,
    "text-sm font-medium text-gray-900 duration-300 ease-in-out hover:text-yellow-500 dark:text-white":
      !setMobileMenuOpen,
  });

  return navigationItems.map((item) => {
    return (
      <ReactRouterLink
        to={item.to}
        key={item.name}
        className={menuStyles}
        onClick={setMobileMenuOpen && (() => setMobileMenuOpen(false))}
      >
        {item.name}
      </ReactRouterLink>
    );
  });
}

const ContestURL = "https://github.com/wasp-lang/wasp";

function Announcement() {
  return (
    <div className="flex justify-center items-center gap-3 p-3 w-full bg-gradient-to-r from-[#d946ef] to-[#fc0] font-semibold text-white text-center z-49">
      <p className="cursor-default hover:opacity-90 hover:drop-shadow text-sm sm:text-base">
        🚀 New features dropping soon – be the first to know ✨
      </p>
    </div>
  );
}
