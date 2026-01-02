/**
 * Menu page for browsing and ordering menu items.
 *
 * Displays the full product catalog with filtering by category,
 * search functionality, and add to cart capabilities.
 *
 * Features:
 * - Category filtering (all, appetizers, entrees, drinks, desserts)
 * - Search by name or description
 * - Grid layout with responsive breakpoints
 * - Cart integration with quantity indicators
 * - Loading and empty states
 * - Accessibility support
 *
 * Route: /menu
 */

import { useState, useMemo, useEffect } from "react";
import { CategoryFilter } from "../components/menu/CategoryFilter";
import { SearchBar } from "../components/menu/SearchBar";
import { MenuItemCard, MenuItemCardSkeleton } from "../components/menu/MenuItemCard";
import { mockMenuItems, getMenuCategories } from "../data/mockMenuItems";
import type { MenuCategory } from "../types/menu";
import { cn } from "../lib/utils";

/**
 * Number of skeleton cards to show while loading.
 */
const SKELETON_COUNT = 8;

/**
 * Menu page component.
 *
 * Main product catalog page with filtering and search.
 * Displays all available menu items in a responsive grid.
 */
export function MenuPage() {
  // State for filters and search
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Available categories from mock data
  const categories = useMemo(() => {
    return ["all" as const, ...getMenuCategories()] as const;
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter menu items based on category and search query
  const filteredItems = useMemo(() => {
    let items = mockMenuItems;

    // Filter by category
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.ingredients?.some((ingredient) =>
            ingredient.toLowerCase().includes(query)
          )
      );
    }

    return items;
  }, [selectedCategory, searchQuery]);

  // Get count of items per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: mockMenuItems.length,
    };

    mockMenuItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return counts;
  }, []);

  /**
   * Handle category change with scroll to top.
   */
  const handleCategoryChange = (category: MenuCategory | "all") => {
    setSelectedCategory(category);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle search change.
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  /**
   * Clear all filters.
   */
  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>

          {/* Search bar skeleton */}
          <div className="mb-6">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Category filter skeleton */}
          <div className="mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <MenuItemCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
          <p className="text-gray-600 mt-2">
            Explore our delicious selection of dishes and beverages
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for dishes, ingredients..."
            />
          </div>

          {/* Category filter */}
          <div>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
              variant="pills"
            />
          </div>

          {/* Active filters summary */}
          {(selectedCategory !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                {selectedCategory !== "all" && (
                  <span className="font-medium capitalize">
                    {selectedCategory}
                  </span>
                )}
                {selectedCategory !== "all" && searchQuery && " + "}
                {searchQuery && (
                  <span className="font-medium">"{searchQuery}"</span>
                )}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ml-1 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Clear all filters"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Results summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredItems.length}
            </span>{" "}
            {filteredItems.length === 1 ? "item" : "items"}
            {selectedCategory !== "all" && (
              <>
                {" "}
                in{" "}
                <span className="font-medium capitalize">
                  {selectedCategory}
                </span>
              </>
            )}
            {searchQuery && (
              <>
                {" "}
                matching "<span className="font-medium">{searchQuery}</span>"
              </>
            )}
          </p>
        </div>

        {/* Menu items grid */}
        {filteredItems.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="list"
            aria-label="Menu items"
          >
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                variant="default"
                showAddButton
                showDietary
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No items match your search for "${searchQuery}"`
                : selectedCategory !== "all"
                ? `No items available in ${selectedCategory}`
                : "No items available at the moment"}
            </p>
            {(selectedCategory !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Category summary section */}
        {searchQuery === "" && selectedCategory === "all" && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.slice(1).map((category) => {
                const count = categoryCounts[category] || 0;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                      "p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-center",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    )}
                  >
                    <div className="text-3xl mb-2" aria-hidden="true">
                      {category === "appetizers" && "🥗"}
                      {category === "entrees" && "🍝"}
                      {category === "drinks" && "🍹"}
                      {category === "desserts" && "🍰"}
                    </div>
                    <div className="font-medium text-gray-900 capitalize">
                      {category}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {count} {count === 1 ? "item" : "items"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Menu page with sidebar layout variant.
 *
 * Alternative layout with sidebar for categories and main area for items.
 * Useful for larger screens with more categories.
 *
 * @example
 * <MenuPageWithSidebar />
 */
export function MenuPageWithSidebar() {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    return ["all" as const, ...getMenuCategories()] as const;
  }, []);

  const filteredItems = useMemo(() => {
    let items = mockMenuItems;

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
          <p className="text-gray-600 mt-2">
            Explore our delicious selection
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Search */}
              <div>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search..."
                />
              </div>

              {/* Categories */}
              <nav
                className="bg-white rounded-lg border border-gray-200 p-4"
                aria-label="Menu categories"
              >
                <h2 className="font-semibold text-gray-900 mb-3">Categories</h2>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-colors duration-150",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        selectedCategory === category
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="capitalize">
                        {category === "all" ? "All Items" : category}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content - Menu items */}
          <main className="flex-1">
            {/* Results */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{filteredItems.length}</span>{" "}
                {filteredItems.length === 1 ? "item" : "items"}
                {selectedCategory !== "all" && (
                  <span className="ml-1">
                    in{" "}
                    <span className="font-medium capitalize">
                      {selectedCategory}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {/* Grid */}
            {filteredItems.length > 0 ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                role="list"
                aria-label="Menu items"
              >
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No items found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default MenuPage;
