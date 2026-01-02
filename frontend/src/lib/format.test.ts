/**
 * Tests for formatting utilities (lib/utils.ts).
 * Verify currency formatting consistent across app.
 */

import { describe, it, expect } from "vitest";
import { formatCurrency, cn } from "./utils";

describe("formatCurrency", () => {
  describe("basic formatting", () => {
    it("should format whole dollars correctly", () => {
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1)).toBe("$1.00");
      expect(formatCurrency(10)).toBe("$10.00");
      expect(formatCurrency(100)).toBe("$100.00");
      expect(formatCurrency(1000)).toBe("$1,000.00");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("should format cents correctly", () => {
      expect(formatCurrency(0.01)).toBe("$0.01");
      expect(formatCurrency(0.5)).toBe("$0.50");
      expect(formatCurrency(0.99)).toBe("$0.99");
      expect(formatCurrency(1.99)).toBe("$1.99");
      expect(formatCurrency(10.50)).toBe("$10.50");
      expect(formatCurrency(100.99)).toBe("$100.99");
    });

    it("should format amounts with many decimal places", () => {
      // Should round to 2 decimal places
      expect(formatCurrency(1.999)).toBe("$2.00");
      expect(formatCurrency(10.555)).toBe("$10.56");
      expect(formatCurrency(100.999)).toBe("$101.00");
      expect(formatCurrency(99.994)).toBe("$99.99");
    });

    it("should handle large numbers", () => {
      expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
      expect(formatCurrency(999999999.99)).toBe("$999,999,999.99");
      expect(formatCurrency(1000000000)).toBe("$1,000,000,000.00");
    });

    it("should handle negative numbers", () => {
      expect(formatCurrency(-1)).toBe("-$1.00");
      expect(formatCurrency(-10.50)).toBe("-$10.50");
      expect(formatCurrency(-100)).toBe("-$100.00");
      expect(formatCurrency(-0.99)).toBe("-$0.99");
    });

    it("should handle very small numbers", () => {
      expect(formatCurrency(0.001)).toBe("$0.00"); // Rounds to 0.00
      expect(formatCurrency(0.004)).toBe("$0.00"); // Rounds down
      expect(formatCurrency(0.005)).toBe("$0.01"); // Rounds up
    });
  });

  describe("custom options", () => {
    it("should accept custom Intl.NumberFormatOptions", () => {
      // Change currency
      expect(formatCurrency(100, { currency: "EUR" })).toBe("€100.00");

      // Change decimal places
      expect(formatCurrency(100, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe(
        "$100"
      );

      // Change locale (via locale property, though function uses en-US by default)
      expect(formatCurrency(1000, { minimumFractionDigits: 3 })).toBe("$1,000.000");
    });

    it("should merge custom options with defaults", () => {
      // Default is 2 decimal places, but we can override
      const result = formatCurrency(99.99, { minimumFractionDigits: 3 });
      expect(result).toBe("$99.990");

      // With currency option
      const result2 = formatCurrency(50, { currency: "JPY" });
      expect(result2).toContain("50"); // Should format with JPY symbol
    });
  });

  describe("edge cases", () => {
    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(0.0)).toBe("$0.00");
      expect(formatCurrency(0.00)).toBe("$0.00");
    });

    it("should handle very precise decimal input", () => {
      expect(formatCurrency(12.3456789)).toBe("$12.35");
      expect(formatCurrency(99.99999)).toBe("$100.00");
      expect(formatCurrency(0.00499)).toBe("$0.00");
    });

    it("should handle numbers that need rounding up", () => {
      expect(formatCurrency(1.005)).toBe("$1.01");
      expect(formatCurrency(10.995)).toBe("$11.00");
      expect(formatCurrency(100.445)).toBe("$100.45");
    });

    it("should handle numbers that need rounding down", () => {
      expect(formatCurrency(1.004)).toBe("$1.00");
      expect(formatCurrency(10.994)).toBe("$10.99");
      expect(formatCurrency(100.444)).toBe("$100.44");
    });
  });

  describe("consistency", () => {
    it("should always return the same format for the same input", () => {
      const amount = 1234.56;
      const result1 = formatCurrency(amount);
      const result2 = formatCurrency(amount);
      const result3 = formatCurrency(amount);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should format consistently across different magnitudes", () => {
      // All should have exactly 2 decimal places
      expect(formatCurrency(1)).toMatch(/^\$\d+\.\d{2}$/);
      expect(formatCurrency(10)).toMatch(/^\$\d+\.\d{2}$/);
      expect(formatCurrency(100)).toMatch(/^\$\d+\.\d{2}$/);
      expect(formatCurrency(1000)).toMatch(/^\$\d{1,3}(,\d{3})*\.\d{2}$/);
    });

    it("should use USD currency symbol", () => {
      expect(formatCurrency(100)).toStartWith("$");
      expect(formatCurrency(50.50)).toStartWith("$");
      expect(formatCurrency(0.99)).toStartWith("$");
    });
  });
});

describe("cn (className utility)", () => {
  describe("basic usage", () => {
    it("should merge class names correctly", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
      expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
    });

    it("should handle empty strings", () => {
      expect(cn("", "foo")).toBe("foo");
      expect(cn("foo", "")).toBe("foo");
      expect(cn("", "")).toBe("");
    });

    it("should handle undefined and null", () => {
      expect(cn(undefined, "foo")).toBe("foo");
      expect(cn("foo", undefined)).toBe("foo");
      expect(cn(null, "foo")).toBe("foo");
      expect(cn("foo", null)).toBe("foo");
    });

    it("should handle arrays", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
      expect(cn("foo", ["bar", "baz"])).toBe("foo bar baz");
    });

    it("should handle objects with conditional classes", () => {
      expect(cn({ foo: true, bar: false })).toBe("foo");
      expect(cn({ foo: true, bar: true })).toBe("foo bar");
      expect(cn({ foo: false, bar: false })).toBe("");
      expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });
  });

  describe("Tailwind class merging", () => {
    it("should merge conflicting Tailwind classes correctly", () => {
      // Later classes should override earlier ones for the same property
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should handle multiple conflicting classes", () => {
      expect(cn("px-2 py-2 text-sm", "px-4 py-4 text-lg")).toBe("px-4 py-4 text-lg");
    });

    it("should preserve non-conflicting classes", () => {
      expect(cn("px-2", "py-2")).toBe("px-2 py-2");
      expect(cn("text-sm font-bold", "text-lg")).toBe("font-bold text-lg");
      expect(cn("bg-red-500 text-white", "px-4")).toBe("bg-red-500 text-white px-4");
    });

    it("should handle complex Tailwind class combinations", () => {
      expect(
        cn("flex items-center justify-center gap-2", "flex-col", "gap-4")
      ).toBe("flex items-center justify-center flex-col gap-4");

      expect(
        cn("w-full h-full bg-white dark:bg-black", "bg-gray-100")
      ).toBe("w-full h-full bg-gray-100 dark:bg-black");
    });
  });

  describe("conditional classes", () => {
    it("should handle conditional classes based on boolean", () => {
      const isActive = true;
      expect(cn("base", isActive && "active")).toBe("base active");

      const isDisabled = false;
      expect(cn("base", isDisabled && "disabled")).toBe("base");
    });

    it("should handle conditional classes with ternary operator", () => {
      const active = true;
      expect(cn("base", active ? "active" : "inactive")).toBe("base active");

      const active2 = false;
      expect(cn("base", active2 ? "active" : "inactive")).toBe("base inactive");
    });

    it("should handle object-based conditional classes", () => {
      const props = {
        active: true,
        disabled: false,
        primary: true,
      };

      expect(cn({
        "bg-blue-500": props.active,
        "opacity-50": props.disabled,
        "text-white": props.primary,
      })).toBe("bg-blue-500 text-white");
    });
  });

  describe("common use cases", () => {
    it("should handle button variant classes", () => {
      const variant = "primary";
      const size = "large";

      expect(
        cn(
          "base-button",
          variant === "primary" && "bg-blue-500 text-white",
          variant === "secondary" && "bg-gray-500 text-white",
          size === "large" && "px-6 py-3",
          size === "small" && "px-2 py-1"
        )
      ).toBe("base-button bg-blue-500 text-white px-6 py-3");
    });

    it("should handle responsive classes", () => {
      expect(
        cn("px-2 md:px-4 lg:px-6", "py-2 md:py-4 lg:py-6")
      ).toBe("px-2 py-2 md:px-4 md:py-4 lg:px-6 lg:py-6");
    });

    it("should handle stateful classes", () => {
      const isHovered = true;
      const isFocused = false;

      expect(
        cn(
          "base",
          isHovered && "hover:bg-blue-600",
          isFocused && "ring-2 ring-blue-500"
        )
      ).toBe("base hover:bg-blue-600");
    });

    it("should handle dark mode classes", () => {
      expect(
        cn("bg-white text-black", "dark:bg-black dark:text-white")
      ).toBe("bg-white text-black dark:bg-black dark:text-white");
    });
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn([])).toBe("");
      expect(cn({})).toBe("");
    });

    it("should handle only whitespace", () => {
      expect(cn("  ")).toBe("");
      expect(cn("foo", "  ", "bar")).toBe("foo bar");
    });

    it("should handle duplicate classes", () => {
      // twMerge should deduplicate
      expect(cn("foo", "foo")).toBe("foo");
      expect(cn("foo bar", "bar")).toBe("foo bar");
    });

    it("should handle mixed input types", () => {
      expect(
        cn(
          "string",
          ["array"],
          { object: true, conditional: false },
          undefined,
          null,
          ""
        )
      ).toBe("string array object");
    });
  });
});

describe("integration tests", () => {
  it("should work with real-world component className patterns", () => {
    const size = "md";
    const variant = "primary";
    const disabled = false;

    const className = cn(
      "base-class",
      variant === "primary" && "bg-blue-500 text-white",
      variant === "secondary" && "bg-gray-500 text-gray-900",
      size === "sm" && "px-2 py-1 text-sm",
      size === "md" && "px-4 py-2 text-base",
      size === "lg" && "px-6 py-3 text-lg",
      disabled && "opacity-50 cursor-not-allowed"
    );

    expect(className).toBe("base-class bg-blue-500 text-white px-4 py-2 text-base");
  });

  it("should work with complex utility combinations", () => {
    const className = cn(
      "flex items-center justify-between w-full p-4",
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "rounded-lg shadow-sm",
      "hover:shadow-md transition-shadow"
    );

    expect(className).toContain("flex");
    expect(className).toContain("items-center");
    expect(className).toContain("justify-between");
    expect(className).toContain("w-full");
    expect(className).toContain("p-4");
    expect(className).toContain("bg-white");
    expect(className).toContain("dark:bg-gray-800");
  });
});
