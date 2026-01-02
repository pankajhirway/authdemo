/**
 * Footer component for the main application footer.
 *
 * Displays copyright information, helpful links, and branding.
 * Provides a professional footer with links to documentation,
 * support, and legal information.
 *
 * Features:
 * - Multi-column layout with links
 * - Responsive design (stacks on mobile)
 * - Social media links
 * - Accessibility compliant
 *
 * @example
 * <Footer />
 */

import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

/**
 * Props for the Footer component.
 */
export interface FooterProps {
  /** Application name for copyright */
  appName?: string;
  /** Current year for copyright (auto-detected if not provided) */
  year?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Footer section configuration.
 */
interface FooterSection {
  /** Section title */
  title: string;
  /** Links in the section */
  links: Array<{
    /** Link label */
    label: string;
    /** Link URL (can be external or internal) */
    href: string;
    /** Whether this is an external link */
    external?: boolean;
    /** ARIA label for accessibility */
    ariaLabel?: string;
  }>;
}

/**
 * Footer sections configuration.
 */
const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Menu", href: "/menu", ariaLabel: "View our menu" },
      { label: "Orders", href: "/orders", ariaLabel: "View your orders" },
      { label: "Track Order", href: "/orders", ariaLabel: "Track your order status" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#", ariaLabel: "Get help and support" },
      { label: "Contact Us", href: "#", ariaLabel: "Contact customer support" },
      { label: "FAQ", href: "#", ariaLabel: "Frequently asked questions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#", ariaLabel: "Learn about our company" },
      { label: "Privacy Policy", href: "#", ariaLabel: "View privacy policy" },
      { label: "Terms of Service", href: "#", ariaLabel: "View terms of service" },
    ],
  },
];

/**
 * Social media link configuration.
 */
const SOCIAL_LINKS = [
  {
    name: "Twitter",
    href: "#",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
      />
    ),
    ariaLabel: "Follow us on Twitter",
  },
  {
    name: "GitHub",
    href: "#",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
      />
    ),
    ariaLabel: "View our GitHub repository",
  },
  {
    name: "LinkedIn",
    href: "#",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M3 5a2 2 0 114 0 2 2 0 01-4 0z"
      />
    ),
    ariaLabel: "Connect with us on LinkedIn",
  },
];

/**
 * Footer component.
 *
 * Displays the main application footer with links, copyright,
 * and social media icons.
 *
 * @param props - Component props
 * @returns Footer component
 */
export function Footer({ appName = "OrderDemo", year = new Date().getFullYear(), className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-gray-200 bg-gray-50 text-gray-600",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2" aria-label={`${appName} home`}>
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
                <span className="text-lg font-bold text-gray-900">{appName}</span>
              </Link>
              <p className="mt-4 text-sm text-gray-600">
                A demo ordering interface showcasing role-based authentication and authorization.
              </p>
            </div>

            {/* Footer sections */}
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => {
                    const LinkComponent = link.external ? "a" : Link;
                    const linkProps = link.external
                      ? { href: link.href, target: "_blank", rel: "noopener noreferrer" }
                      : { to: link.href };

                    return (
                      <li key={link.href}>
                        <LinkComponent
                          {...linkProps}
                          className={cn(
                            "text-sm text-gray-600 hover:text-gray-900",
                            "transition-colors duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                          )}
                          aria-label={link.ariaLabel || link.label}
                        >
                          {link.label}
                        </LinkComponent>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar with copyright and social links */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <p className="text-sm text-gray-600">
              &copy; {year} {appName}. All rights reserved. Built with{" "}
              <span className="text-red-500" role="img" aria-label="heart">
                ❤
              </span>{" "}
              for demonstration purposes.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <span className="sr-only">Follow us on social media</span>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    "transition-colors duration-200"
                  )}
                  aria-label={social.ariaLabel}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * CompactFooter component.
 *
 * A simplified footer variant with just copyright and minimal links.
 * Suitable for pages where a full footer is too heavy.
 *
 * @example
 * <CompactFooter />
 */
export function CompactFooter({ appName = "OrderDemo", year = new Date().getFullYear(), className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-gray-200 bg-white py-6",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            &copy; {year} {appName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              to="#"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              to="#"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Terms
            </Link>
            <Link
              to="#"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * FooterSkeleton component.
 *
 * Loading skeleton for the footer.
 * Shows while footer data is being loaded.
 *
 * @example
 * <FooterSkeleton />
 */
export function FooterSkeleton() {
  return (
    <footer
      className="border-t border-gray-200 bg-gray-50"
      role="contentinfo"
      aria-label="Footer loading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand skeleton */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Section skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-300" />
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar skeleton */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex items-center justify-between">
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
            <div className="flex gap-4">
              <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
              <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
              <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
