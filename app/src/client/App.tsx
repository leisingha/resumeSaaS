import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import CookieConsentBanner from "./components/cookie-consent/Banner";
import { appNavigationItems } from "./components/NavBar/contentSections";
import { landingPageNavigationItems } from "../landing-page/contentSections";
import { useMemo, useEffect } from "react";
import { routes } from "wasp/client/router";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { useIsLandingPage } from "./hooks/useIsLandingPage";
import { Toaster } from "react-hot-toast";

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const { data: user } = useAuth();
  const isLandingPage = useIsLandingPage();

  // Use landing page navigation for public marketing pages
  const shouldUseLandingPageNav = useMemo(() => {
    return (
      location.pathname === "/" ||
      location.pathname === "/pricing" ||
      location.pathname === "/contact-us"
    );
  }, [location]);

  const navigationItems = shouldUseLandingPageNav
    ? landingPageNavigationItems
    : appNavigationItems;

  // Force dark mode immediately on component mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
    localStorage.removeItem("color-theme");
  }, []);

  const shouldDisplayAppNavBar = useMemo(() => {
    return (
      location.pathname !== routes.LoginRoute.build() &&
      location.pathname !== routes.SignupRoute.build()
    );
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <>
      <div className="min-h-screen dark:text-white dark:bg-boxdark-2">
        {isAdminDashboard ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && (
              <NavBar navigationItems={navigationItems} />
            )}
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </>
        )}
      </div>
      <CookieConsentBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 4000,
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />
    </>
  );
}
