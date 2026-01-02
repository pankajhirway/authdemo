/**
 * Navigation component for the main application navigation.
 *
 * Provides navigation links based on user roles.
 * Different users see different navigation options:
 * - All authenticated users: Menu, Cart, Orders
 * - Operator: Operator Dashboard
 * - Supervisor: Supervisor Dashboard
 * - Auditor: Auditor Dashboard
 * - Admin: Admin Dashboard
 *
 * Features:
 * - Role-based navigation links
 * - Responsive design with mobile drawer
 * - Active link highlighting
 * - Accessible ARIA labels
 *
 * @example
 * <Navigation isMobile={false} />
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useCurrentUser, useHasRole } from "../../store/auth";
import type { UserRole } from "../../types/api";

/**
 * Props for the Navigation component.
 */
export interface NavigationProps {
  /** Whether this is the mobile navigation variant */
  isMobile?: boolean;
  /** Callback when a link is clicked (for mobile menu close) */
  onLinkClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Navigation link configuration.
 * Defines all available navigation links with their roles and display info.
 */
interface NavLink {
  /** URL path */
  href: string;
  /** Display label */
  label: string;
  /** Icon as emoji or SVG path string */
  icon: string;
  /** Roles that can see this link (empty = all authenticated) */
  roles: UserRole[];
  /** Description for accessibility */
  description: string;
}

/**
 * Main navigation links.
 * Ordered by importance and logical grouping.
 */
const NAV_LINKS: NavLink[] = [
  // Core ordering links (available to all authenticated users)
  {
    href: "/menu",
    label: "Menu",
    icon: "M4 6h16M4 12h16M4 18h16",
    roles: [], // All authenticated users
    description: "Browse menu and add items to cart",
  },
  {
    href: "/cart",
    label: "Cart",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    roles: [], // All authenticated users
    description: "View shopping cart and checkout",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    roles: [], // All authenticated users
    description: "View order history and tracking",
  },
  // Dashboard links (role-specific)
  {
    href: "/operator",
    label: "Operator Dashboard",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    roles: ["operator", "admin"],
    description: "Operator dashboard for creating orders",
  },
  {
    href: "/supervisor",
    label: "Supervisor Dashboard",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    roles: ["supervisor", "admin"],
    description: "Supervisor dashboard for approving orders",
  },
  {
    href: "/auditor",
    label: "Auditor Dashboard",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    roles: ["auditor", "admin"],
    description: "Auditor dashboard for read-only access",
  },
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    roles: ["admin"],
    description: "Admin dashboard for system metrics and settings",
  },
];

/**
 * Get SVG icon component from path string.
 */
function IconFromPath({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/**
 * Check if a link is accessible to the current user.
 * Admin users can access all links.
 */
function canAccessLink(userRole: UserRole | null, link: NavLink): boolean {
  if (!userRole) {
    return false; // Not authenticated
  }

  // Admin override (matches backend pattern)
  if (userRole === "admin") {
    return true;
  }

  // No roles specified = all authenticated users
  if (link.roles.length === 0) {
    return true;
  }

  // Check if user's role is in the link's allowed roles
  return link.roles.includes(userRole);
}

/**
 * Navigation component.
 *
 * Displays navigation links based on user role.
 * Supports both desktop and mobile layouts.
 *
 * @param props - Component props
 * @returns Navigation component
 */
export function Navigation({ isMobile = false, onLinkClick, className }: NavigationProps) {
  const location = useLocation();
  const user = useCurrentUser();
  const userRole = user?.role ?? null;
  const hasRole = useHasRole();

  // Filter links based on user role
  const accessibleLinks = NAV_LINKS.filter((link) => canAccessLink(userRole, link));

  // If no user or no accessible links, don't render
  if (accessibleLinks.length === 0) {
    return null;
  }

  // Desktop navigation (horizontal bar)
  if (!isMobile) {
    return (
      <nav
        className={cn("hidden lg:block lg:border-b lg:border-gray-200 lg:bg-gray-50", className)}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center gap-1 overflow-x-auto">
            {accessibleLinks.map((link) => {
              const isActive = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
              const isExternal = link.href.startsWith("http");

              const LinkComponent = isExternal ? "a" : Link;
              const linkProps = isExternal
                ? { href: link.href, target: "_blank", rel: "noopener noreferrer" }
                : { to: link.href };

              return (
                <LinkComponent
                  key={link.href}
                  {...linkProps}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50",
                    isActive
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={link.description}
                >
                  <IconFromPath path={link.icon} className="h-4 w-4 flex-shrink-0" />
                  <span>{link.label}</span>
                </LinkComponent>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  // Mobile navigation (vertical drawer)
  return (
    <nav
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg",
        "transition-transform duration-300 ease-in-out",
        "lg:hidden",
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Close button */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-lg font-semibold text-gray-900">Navigation</span>
        <button
          type="button"
          onClick={onLinkClick}
          className={cn(
            "rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
          aria-label="Close navigation menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1" role="menubar">
          {accessibleLinks.map((link) => {
            const isActive = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);

            return (
              <li key={link.href} role="none">
                <Link
                  to={link.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  <IconFromPath path={link.icon} className="h-5 w-5 flex-shrink-0" />
                  <span>{link.label}</span>
                  {isActive && (
                    <svg
                      className="ml-auto h-4 w-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User info at bottom */}
      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-white font-semibold shadow-sm">
              {user.name?.charAt(0).toUpperCase() || user.preferred_username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.name || user.preferred_username}
              </p>
              <p className="truncate text-xs text-gray-500 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/**
 * NavigationSkeleton component.
 *
 * Loading skeleton for the navigation.
 * Shows while navigation data is being loaded.
 *
 * @example
 * <NavigationSkeleton />
 */
export function NavigationSkeleton() {
  return (
    <nav
      className="hidden lg:block lg:border-b lg:border-gray-200 lg:bg-gray-50"
      role="navigation"
      aria-label="Main navigation loading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-md bg-gray-200"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
