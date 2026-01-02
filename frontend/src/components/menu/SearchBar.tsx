/**
 * SearchBar component for searching menu items.
 *
 * Provides a text input for filtering menu items by name or description.
 * Includes debounced search for better performance.
 *
 * @example
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search menu..."
 * />
 */

import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes (after debounce) */
  onChange: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show a clear button */
  showClear?: boolean;
}

/**
 * SearchBar component.
 *
 * Provides a debounced search input that updates the parent component
 * after the specified delay. This prevents excessive re-renders and filtering.
 *
 * Features:
 * - Debounced input (300ms default)
 * - Clear button to reset search
 * - Loading state indication
 * - Keyboard accessible
 *
 * @param props - Component props
 * @returns Search input component
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search menu items...",
  debounceMs = 300,
  className,
  showClear = true,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when prop value changes (external updates)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce the search callback
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onChange(inputValue);
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, debounceMs, onChange]);

  /**
   * Handle input change.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  /**
   * Clear the search input.
   */
  const handleClear = () => {
    setInputValue("");
    onChange("");
  };

  /**
   * Handle key press.
   * Escape key clears the input.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "block w-full pl-10 pr-10 py-2.5",
            "border border-gray-300 rounded-lg",
            "bg-white text-gray-900 placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-all duration-200",
            "disabled:bg-gray-100 disabled:cursor-not-allowed"
          )}
          aria-label="Search menu items"
          aria-describedby="search-description"
        />

        {/* Clear button */}
        {showClear && inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute inset-y-0 right-0 pr-3 flex items-center",
              "text-gray-400 hover:text-gray-600",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            )}
            aria-label="Clear search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Screen reader description */}
      <span id="search-description" className="sr-only">
        Search for menu items by name or description. Results update automatically as you type.
      </span>
    </div>
  );
}

/**
 * CompactSearchBar component.
 *
 * A smaller variant for use in tight spaces like headers or sidebars.
 *
 * @example
 * <CompactSearchBar value={search} onChange={setSearch} />
 */
interface CompactSearchBarProps extends Omit<SearchBarProps, "placeholder"> {
  /** Placeholder text (default: shorter) */
  placeholder?: string;
}

export function CompactSearchBar({
  placeholder = "Search...",
  ...props
}: CompactSearchBarProps) {
  return (
    <SearchBar
      {...props}
      placeholder={placeholder}
      className={cn("text-sm", props.className)}
    />
  );
}
