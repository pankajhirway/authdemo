/**
 * CategoryFilter component for filtering menu items by category.
 *
 * Provides a horizontal list of category buttons for filtering the menu.
 * Supports both pill and tab styles, with active state indicators.
 *
 * @example
 * <CategoryFilter
 *   categories={["all", "appetizers", "entrees", "drinks", "desserts"]}
 *   selectedCategory="appetizers"
 *   onSelectCategory={(cat) => setSelectedCategory(cat)}
 * />
 */

import { cn } from "../../lib/utils";
import type { MenuCategory } from "../../types/menu";

/**
 * Props for the CategoryFilter component.
 */
interface CategoryFilterProps {
  /** Available categories to filter by */
  categories: (MenuCategory | "all")[];
  /** Currently selected category */
  selectedCategory: MenuCategory | "all";
  /** Callback when a category is selected */
  onSelectCategory: (category: MenuCategory | "all") => void;
  /** Display variant: "pills" or "tabs" */
  variant?: "pills" | "tabs";
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to use scrollable container on mobile */
  scrollable?: boolean;
}

/**
 * Category display names for labels.
 * Maps category values to human-readable names.
 */
const CATEGORY_NAMES: Record<MenuCategory | "all", string> = {
  all: "All Items",
  appetizers: "Appetizers",
  entrees: "Entrees",
  drinks: "Drinks",
  desserts: "Desserts",
};

/**
 * Category icons for visual enhancement.
 * Optional icons for each category.
 */
const CATEGORY_ICONS: Record<MenuCategory | "all", string> = {
  all: "🍽️",
  appetizers: "🥗",
  entrees: "🍝",
  drinks: "🍹",
  desserts: "🍰",
};

/**
 * CategoryFilter component.
 *
 * Displays a horizontal list of clickable category buttons.
 * The selected category is visually distinguished from others.
 *
 * Features:
 * - Two variants: pills (rounded) and tabs (underlined)
 * - Scrollable container for mobile responsiveness
 * - Optional icons for each category
 * - Keyboard accessible navigation
 * - Smooth transitions between states
 *
 * @param props - Component props
 * @returns Category filter buttons
 */
export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  variant = "pills",
  className,
  scrollable = true,
}: CategoryFilterProps) {
  /**
   * Handle category selection with keyboard support.
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    category: MenuCategory | "all"
  ) => {
    // Enter or Space activates the button
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectCategory(category);
    }

    // Arrow keys for navigation
    const currentIndex = categories.indexOf(selectedCategory);
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      onSelectCategory(categories[currentIndex - 1]);
    }
    if (e.key === "ArrowRight" && currentIndex < categories.length - 1) {
      e.preventDefault();
      onSelectCategory(categories[currentIndex + 1]);
    }
  };

  const baseClasses = cn(
    "flex items-center gap-2",
    scrollable && "overflow-x-auto scrollbar-hide",
    className
  );

  const buttonClasses = (isActive: boolean) =>
    cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      "whitespace-nowrap",
      variant === "pills" && [
        "border",
        isActive
          ? "bg-blue-600 border-blue-600 text-white shadow-md"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
      ],
      variant === "tabs" && [
        "border-b-2 border-transparent",
        isActive
          ? "text-blue-600 border-blue-600"
          : "text-gray-600 hover:text-gray-900 hover:border-gray-300",
      ]
    );

  return (
    <nav
      className={baseClasses}
      role="tablist"
      aria-label="Menu categories"
    >
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        const categoryName = CATEGORY_NAMES[category];
        const categoryIcon = CATEGORY_ICONS[category];

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            onKeyDown={(e) => handleKeyDown(e, category)}
            className={buttonClasses(isActive)}
            role="tab"
            aria-selected={isActive}
            aria-controls="menu-items-grid"
            aria-label={`Filter by ${categoryName}`}
          >
            {/* Optional icon */}
            {variant === "pills" && (
              <span className="text-lg" aria-hidden="true">
                {categoryIcon}
              </span>
            )}

            {/* Category name */}
            <span className="hidden sm:inline">{categoryName}</span>
            <span className="sm:hidden">{categoryName.split(" ")[0]}</span>

            {/* Active indicator for tabs */}
            {variant === "tabs" && isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * CompactCategoryFilter component.
 *
 * A smaller variant for use in tight spaces or sidebars.
 * Uses icons only with tooltips for full category names.
 *
 * @example
 * <CompactCategoryFilter
 *   categories={categories}
 *   selectedCategory={selected}
 *   onSelectCategory={setSelected}
 * />
 */
interface CompactCategoryFilterProps {
  /** Available categories to filter by */
  categories: (MenuCategory | "all")[];
  /** Currently selected category */
  selectedCategory: MenuCategory | "all";
  /** Callback when a category is selected */
  onSelectCategory: (category: MenuCategory | "all") => void;
  /** Additional CSS classes */
  className?: string;
}

export function CompactCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: CompactCategoryFilterProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Menu categories"
    >
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        const categoryIcon = CATEGORY_ICONS[category];
        const categoryName = CATEGORY_NAMES[category];

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              isActive && "ring-2 ring-offset-2 ring-blue-600"
            )}
            role="tab"
            aria-selected={isActive}
            aria-label={categoryName}
            title={categoryName}
          >
            {categoryIcon}
          </button>
        );
      })}
    </div>
  );
}
