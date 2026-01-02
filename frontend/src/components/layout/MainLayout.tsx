/**
 * MainLayout component for the main application layout.
 *
 * Combines Header, Navigation, and Footer into a cohesive layout.
 * Handles responsive mobile menu state and provides a consistent
 * layout wrapper for all application pages.
 *
 * Features:
 * - Sticky header with navigation
 * - Mobile-responsive hamburger menu
 * - Desktop sub-navigation bar
 * - Footer at bottom
 * - Proper mobile drawer with overlay
 * - Accessible ARIA attributes
 *
 * @example
 * <MainLayout>
 *   <PageContent />
 * </MainLayout>
 */

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

/**
 * Props for the MainLayout component.
 */
export interface MainLayoutProps {
  /** Child elements to render in the main content area */
  children: React.ReactNode;
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
  /** Whether to show the navigation bar (default: true) */
  showNavigation?: boolean;
  /** Maximum width for the main content area */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Custom className for the main content area */
  contentClassName?: string;
  /** Custom className for the layout wrapper */
  className?: string;
  /** Application name (passed to Header and Footer) */
  appName?: string;
}

/**
 * Max width mapping for Tailwind classes.
 */
const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

/**
 * MainLayout component.
 *
 * Provides the main application layout structure with header,
 * navigation, main content area, and footer.
 *
 * @param props - Component props
 * @returns Main layout component
 */
export function MainLayout({
  children,
  showFooter = true,
  showNavigation = true,
  maxWidth = "full",
  contentClassName,
  className,
  appName = "OrderDemo",
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Close mobile menu on route change or window resize.
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Close mobile menu on desktop breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Handle mobile menu toggle.
   */
  const handleMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  /**
   * Handle mobile menu close.
   */
  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Prevent body scroll when mobile menu is open.
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={cn("min-h-screen flex flex-col bg-gray-50", className)}>
      {/* Header */}
      <Header
        appName={appName}
        onMenuToggle={showNavigation ? handleMenuToggle : undefined}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Desktop Navigation Bar */}
      {showNavigation && <Navigation isMobile={false} />}

      {/* Mobile Navigation Drawer */}
      {showNavigation && isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm",
              "transition-opacity duration-300",
              "lg:hidden"
            )}
            onClick={handleMenuClose}
            aria-hidden="true"
          />

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Navigation isMobile={true} onLinkClick={handleMenuClose} />
          </div>
        </>
      )}

      {/* Main content area */}
      <main
        className={cn(
          "flex-1",
          // Add padding for sticky header and sub-nav
          "pt-0",
          contentClassName
        )}
        role="main"
        id="main-content"
      >
        {/* Content container with max width */}
        <div className={cn("mx-auto w-full", MAX_WIDTH_MAP[maxWidth])}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <Footer appName={appName} />}

      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4",
          "focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2",
          "focus:text-sm focus:font-medium focus:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
      >
        Skip to main content
      </a>
    </div>
  );
}

/**
 * MainLayoutSkeleton component.
 *
 * Loading skeleton for the main layout.
 * Shows while the layout is being loaded.
 *
 * @example
 * <MainLayoutSkeleton />
 */
export function MainLayoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <header
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm"
        role="banner"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Skeleton */}
      <nav className="hidden lg:block lg:border-b lg:border-gray-200 lg:bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-md bg-gray-200" />
            ))}
          </div>
        </div>
      </nav>

      {/* Main content skeleton */}
      <main className="flex-1 py-8" role="main">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t border-gray-200 bg-gray-50" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="col-span-2 md:col-span-1">
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-300" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * CompactLayout component.
 *
 * A simplified layout variant without the sub-navigation bar.
 * Suitable for pages like login, callback, or error pages.
 *
 * @example
 * <CompactLayout>
 *   <LoginPage />
 * </CompactLayout>
 */
export function CompactLayout({
  children,
  showFooter = true,
  contentClassName,
  className,
  appName = "OrderDemo",
}: Omit<MainLayoutProps, "showNavigation" | "maxWidth">) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-gray-50", className)}>
      {/* Compact Header (no menu button) */}
      <Header appName={appName} />

      {/* Main content area */}
      <main
        className={cn("flex-1", contentClassName)}
        role="main"
        id="main-content"
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer appName={appName} />}

      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4",
          "focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2",
          "focus:text-sm focus:font-medium focus:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
      >
        Skip to main content
      </a>
    </div>
  );
}

/**
 * CenteredLayout component.
 *
 * A layout variant that centers content both horizontally and vertically.
 * Suitable for login, authentication, and focused content pages.
 *
 * @example
 * <CenteredLayout>
 *   <AuthPage />
 * </CenteredLayout>
 */
export function CenteredLayout({
  children,
  showFooter = false,
  contentClassName,
  className,
}: Omit<MainLayoutProps, "showNavigation" | "maxWidth" | "appName">) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-gray-50", className)}>
      {/* Main content area - centered */}
      <main
        className={cn(
          "flex-1 flex items-center justify-center px-4 py-12",
          contentClassName
        )}
        role="main"
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
