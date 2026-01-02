/**
 * Header component for the main application header.
 *
 * Displays the application logo/title, navigation menu trigger (mobile),
 * cart indicator with item count, and user menu with logout.
 *
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Cart indicator showing item count
 * - User menu with role badge and logout
 * - Accessible ARIA labels and semantic HTML
 *
 * @example
 * <Header onMenuToggle={() => setMobileMenuOpen(!isOpen)} />
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useCurrentUser, useAuthActions } from "../../store/auth";
import { useCartItemCount } from "../../store/cart";
import type { UserRole } from "../../types/api";

/**
 * Props for the Header component.
 */
export interface HeaderProps {
  /** Callback when mobile menu toggle is clicked */
  onMenuToggle?: () => void;
  /** Whether mobile menu is currently open */
  isMobileMenuOpen?: boolean;
  /** Application name/title */
  appName?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Role badge configuration.
 * Maps roles to display colors and labels.
 */
const ROLE_BADGES: Record<UserRole, { label: string; bgColor: string; textColor: string }> = {
  admin: { label: "Admin", bgColor: "bg-purple-100", textColor: "text-purple-800" },
  auditor: { label: "Auditor", bgColor: "bg-blue-100", textColor: "text-blue-800" },
  supervisor: { label: "Supervisor", bgColor: "bg-green-100", textColor: "text-green-800" },
  operator: { label: "Operator", bgColor: "bg-orange-100", textColor: "text-orange-800" },
};

/**
 * Header component.
 *
 * Displays the main application header with logo, cart indicator, and user menu.
 * Responsive design includes a hamburger menu for mobile devices.
 *
 * @param props - Component props
 * @returns Header component
 */
export function Header({
  onMenuToggle,
  isMobileMenuOpen = false,
  appName = "OrderDemo",
  className,
}: HeaderProps) {
  const user = useCurrentUser();
  const { clearAuth } = useAuthActions();
  const cartItemCount = useCartItemCount();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /**
   * Handle user logout.
   */
  const handleLogout = () => {
    clearAuth();
    setIsUserMenuOpen(false);
  };

  const roleBadge = user ? ROLE_BADGES[user.role] : null;
  const isAuthenticated = user !== null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm",
        className
      )}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {onMenuToggle && (
              <button
                type="button"
                onClick={onMenuToggle}
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-2",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                  "transition-colors duration-200",
                  "lg:hidden"
                )}
                aria-controls="mobile-navigation"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}

            {/* App logo */}
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg hover:bg-gray-50 px-2 py-1 transition-colors duration-200"
              aria-label={`${appName} home`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{appName}</span>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart indicator */}
            {isAuthenticated && (
              <Link
                to="/cart"
                className={cn(
                  "relative inline-flex items-center justify-center rounded-md p-2",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "transition-colors duration-200",
                  "group"
                )}
                aria-label={`Shopping cart with ${cartItemCount} items`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span
                    className={cn(
                      "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center",
                      "rounded-full bg-blue-600 text-xs font-semibold text-white",
                      "transition-transform duration-200 group-hover:scale-110"
                    )}
                    aria-hidden="true"
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2",
                    "text-sm font-medium text-gray-700",
                    "hover:bg-gray-100 hover:text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    "transition-colors duration-200"
                  )}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  {/* User avatar */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-white text-sm font-semibold shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || user?.preferred_username?.charAt(0).toUpperCase() || "U"}
                  </div>

                  {/* Username (hidden on small mobile) */}
                  <span className="hidden sm:block truncate max-w-[120px]">
                    {user?.name || user?.preferred_username || "User"}
                  </span>

                  {/* Role badge (hidden on small mobile) */}
                  {roleBadge && (
                    <span
                      className={cn(
                        "hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                        roleBadge.bgColor,
                        roleBadge.textColor
                      )}
                      aria-hidden="true"
                    >
                      {roleBadge.label}
                    </span>
                  )}

                  {/* Dropdown arrow */}
                  <svg
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isUserMenuOpen && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5",
                      "focus:outline-none",
                      "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <div className="py-1" role="none">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || user?.preferred_username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || "No email"}
                        </p>
                        {roleBadge && (
                          <span
                            className={cn(
                              "mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium sm:hidden",
                              roleBadge.bgColor,
                              roleBadge.textColor
                            )}
                          >
                            {roleBadge.label}
                          </span>
                        )}
                      </div>

                      {/* Menu items */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm text-gray-700",
                          "hover:bg-gray-100 hover:text-gray-900",
                          "focus:outline-none focus:bg-gray-100",
                          "transition-colors duration-150",
                          "flex items-center gap-2"
                        )}
                        role="menuitem"
                        tabIndex={-1}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login button (when not authenticated) */}
            {!isAuthenticated && (
              <Link
                to="/login"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2",
                  "text-sm font-medium text-white",
                  "bg-blue-600 hover:bg-blue-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "shadow-sm hover:shadow-md",
                  "transition-all duration-200"
                )}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * HeaderSkeleton component.
 *
 * Loading skeleton for the header.
 * Shows while header data is being loaded.
 *
 * @example
 * <HeaderSkeleton />
 */
export function HeaderSkeleton() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Right side skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
            <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>
      </div>
    </header>
  );
}
