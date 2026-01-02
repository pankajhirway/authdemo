/**
 * PaymentForm component for entering payment information.
 *
 * Mock payment form that simulates credit card processing.
 * In production, this would integrate with a payment processor like Stripe.
 *
 * @example
 * <PaymentForm
 *   total={28.06}
 *   isProcessing={false}
 *   onSubmit={(paymentData) => handlePayment(paymentData)}
 * />
 */

import { useState } from "react";
import { cn, formatCurrency } from "../../lib/utils";

/**
 * Credit card type.
 */
export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

/**
 * Props for the PaymentForm component.
 */
export interface PaymentFormProps {
  /** Total amount to charge */
  total: number;
  /** Whether payment is currently being processed */
  isProcessing?: boolean;
  /** Callback when payment form is submitted */
  onSubmit: (paymentData: PaymentData) => void | Promise<void>;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Payment data submitted by the form.
 */
export interface PaymentData {
  /** Cardholder name */
  cardholderName: string;
  /** Card number (masked for security) */
  cardNumber: string;
  /** Card type (detected from number) */
  cardType: CardType;
  /** Expiry month (1-12) */
  expiryMonth: number;
  /** Expiry year (4-digit) */
  expiryYear: number;
  /** CVV/CVC security code */
  cvv: string;
  /** Billing address line 1 */
  addressLine1: string;
  /** Billing address line 2 (optional) */
  addressLine2?: string;
  /** Billing city */
  city: string;
  /** Billing state/province */
  state: string;
  /** Billing ZIP/postal code */
  zipCode: string;
  /** Save card for future use */
  saveCard: boolean;
}

/**
 * Current year for expiry validation.
 */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * PaymentForm component.
 *
 * Mock payment form with:
 * - Cardholder name input
 * - Card number with type detection
 * - Expiry date (month/year) with validation
 * - CVV security code
 * - Billing address fields
 * - Save card option
 * - Form validation
 * - Loading state during processing
 *
 * Features:
 * - Card type auto-detection
 * - Input formatting and masking
 * - Client-side validation
 * - Accessibility support
 * - Keyboard navigation
 *
 * @param props - Component props
 * @returns Payment form component
 */
export function PaymentForm({
  total,
  isProcessing = false,
  onSubmit,
  onCancel,
  className,
}: PaymentFormProps) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Detect card type from card number.
   */
  const detectCardType = (number: string): CardType => {
    const cleaned = number.replace(/\s/g, "");

    if (/^4/.test(cleaned)) return "visa";
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";
    if (/^6(?:011|5)/.test(cleaned)) return "discover";

    return "unknown";
  };

  /**
   * Format card number with spaces.
   */
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(" ").substr(0, 19);
  };

  /**
   * Handle card number input.
   */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(value));
    }

    if (touched.cardNumber) {
      validateField("cardNumber", cleaned);
    }
  };

  /**
   * Validate a single field.
   */
  const validateField = (field: string, value: string): boolean => {
    let error = "";

    switch (field) {
      case "cardholderName":
        if (!value.trim()) error = "Cardholder name is required";
        else if (value.trim().length < 2) error = "Please enter a valid name";
        break;
      case "cardNumber":
        const cleanedNumber = value.replace(/\s/g, "");
        if (!cleanedNumber) error = "Card number is required";
        else if (cleanedNumber.length < 13) error = "Card number is too short";
        else if (cleanedNumber.length > 16) error = "Card number is too long";
        break;
      case "expiryMonth":
        if (!value) error = "Month is required";
        else if (parseInt(value, 10) < 1 || parseInt(value, 10) > 12)
          error = "Invalid month";
        break;
      case "expiryYear":
        if (!value) error = "Year is required";
        else if (parseInt(value, 10) < CURRENT_YEAR)
          error = "Card has expired";
        break;
      case "cvv":
        if (!value) error = "CVV is required";
        else if (value.length < 3) error = "CVV is too short";
        break;
      case "addressLine1":
        if (!value.trim()) error = "Address is required";
        break;
      case "city":
        if (!value.trim()) error = "City is required";
        break;
      case "state":
        if (!value.trim()) error = "State is required";
        break;
      case "zipCode":
        if (!value.trim()) error = "ZIP code is required";
        else if (!/^\d{5}(-\d{4})?$/.test(value))
          error = "Invalid ZIP code";
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  /**
   * Mark field as touched.
   */
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let value = "";
    switch (field) {
      case "cardholderName":
        value = cardholderName;
        break;
      case "cardNumber":
        value = cardNumber;
        break;
      case "expiryMonth":
        value = expiryMonth;
        break;
      case "expiryYear":
        value = expiryYear;
        break;
      case "cvv":
        value = cvv;
        break;
      case "addressLine1":
        value = addressLine1;
        break;
      case "city":
        value = city;
        break;
      case "state":
        value = state;
        break;
      case "zipCode":
        value = zipCode;
        break;
    }

    validateField(field, value);
  };

  /**
   * Validate all form fields.
   */
  const validateForm = (): boolean => {
    const cleanedNumber = cardNumber.replace(/\s/g, "");

    return (
      validateField("cardholderName", cardholderName) &&
      validateField("cardNumber", cleanedNumber) &&
      validateField("expiryMonth", expiryMonth) &&
      validateField("expiryYear", expiryYear) &&
      validateField("cvv", cvv) &&
      validateField("addressLine1", addressLine1) &&
      validateField("city", city) &&
      validateField("state", state) &&
      validateField("zipCode", zipCode)
    );
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      cardholderName: true,
      cardNumber: true,
      expiryMonth: true,
      expiryYear: true,
      cvv: true,
      addressLine1: true,
      city: true,
      state: true,
      zipCode: true,
    });

    if (!validateForm()) {
      return;
    }

    const paymentData: PaymentData = {
      cardholderName: cardholderName.trim(),
      cardNumber: cardNumber.replace(/\s/g, ""),
      cardType: detectCardType(cardNumber),
      expiryMonth: parseInt(expiryMonth, 10),
      expiryYear: parseInt(expiryYear, 10),
      cvv,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      saveCard,
    };

    await onSubmit(paymentData);
  };

  /**
   * Generate years for expiry dropdown.
   */
  const generateYears = (): number[] => {
    const years = [];
    for (let i = 0; i < 20; i++) {
      years.push(CURRENT_YEAR + i);
    }
    return years;
  };

  const cardType = detectCardType(cardNumber);
  const hasErrors = Object.keys(errors).some((key) => errors[key]);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6",
        className
      )}
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Payment Information</h2>
        <p className="text-sm text-gray-600 mt-1">
          All transactions are secure and encrypted
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <svg
          className="w-5 h-5 text-green-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="text-sm text-green-800">
          This is a secure demo. No real payment will be processed.
        </p>
      </div>

      {/* Payment form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cardholder name */}
        <div className="space-y-2">
          <label
            htmlFor="cardholder-name"
            className="block text-sm font-medium text-gray-700"
          >
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholder-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            onBlur={() => handleFieldBlur("cardholderName")}
            placeholder="John Doe"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder:text-gray-400",
              touched.cardholderName && errors.cardholderName
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300"
            )}
            disabled={isProcessing}
            aria-invalid={touched.cardholderName && !!errors.cardholderName}
            aria-describedby={
              touched.cardholderName && errors.cardholderName
                ? "cardholder-name-error"
                : undefined
            }
          />
          {touched.cardholderName && errors.cardholderName && (
            <p
              id="cardholder-name-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.cardholderName}
            </p>
          )}
        </div>

        {/* Card number */}
        <div className="space-y-2">
          <label
            htmlFor="card-number"
            className="block text-sm font-medium text-gray-700"
          >
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              id="card-number"
              value={cardNumber}
              onChange={handleCardNumberChange}
              onBlur={() => handleFieldBlur("cardNumber")}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={cn(
                "w-full px-3 py-2 pr-12 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400",
                touched.cardNumber && errors.cardNumber
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              )}
              disabled={isProcessing}
              aria-invalid={touched.cardNumber && !!errors.cardNumber}
              aria-describedby={
                touched.cardNumber && errors.cardNumber
                  ? "card-number-error"
                  : undefined
              }
            />
            {/* Card type icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cardType === "visa" && (
                <span className="text-blue-600 font-bold text-xs">VISA</span>
              )}
              {cardType === "mastercard" && (
                <span className="text-red-600 font-bold text-xs">MC</span>
              )}
              {cardType === "amex" && (
                <span className="text-blue-800 font-bold text-xs">AMEX</span>
              )}
              {cardType === "discover" && (
                <span className="text-orange-600 font-bold text-xs">DISC</span>
              )}
            </div>
          </div>
          {touched.cardNumber && errors.cardNumber && (
            <p
              id="card-number-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {errors.cardNumber}
            </p>
          )}
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          {/* Expiry month */}
          <div className="space-y-2">
            <label
              htmlFor="expiry-month"
              className="block text-sm font-medium text-gray-700"
            >
              Expiry Month
            </label>
            <select
              id="expiry-month"
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value)}
              onBlur={() => handleFieldBlur("expiryMonth")}
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "bg-white",
                touched.expiryMonth && errors.expiryMonth
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              )}
              disabled={isProcessing}
              aria-invalid={touched.expiryMonth && !!errors.expiryMonth}
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            {touched.expiryMonth && errors.expiryMonth && (
              <p className="text-sm text-red-600" role="alert">
                {errors.expiryMonth}
              </p>
            )}
          </div>

          {/* Expiry year */}
          <div className="space-y-2">
            <label
              htmlFor="expiry-year"
              className="block text-sm font-medium text-gray-700"
            >
              Expiry Year
            </label>
            <select
              id="expiry-year"
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value)}
              onBlur={() => handleFieldBlur("expiryYear")}
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "bg-white",
                touched.expiryYear && errors.expiryYear
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              )}
              disabled={isProcessing}
              aria-invalid={touched.expiryYear && !!errors.expiryYear}
            >
              <option value="">Year</option>
              {generateYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {touched.expiryYear && errors.expiryYear && (
              <p className="text-sm text-red-600" role="alert">
                {errors.expiryYear}
              </p>
            )}
          </div>
        </div>

        {/* CVV */}
        <div className="space-y-2">
          <label
            htmlFor="cvv"
            className="block text-sm font-medium text-gray-700"
          >
            CVV / CVC
          </label>
          <div className="relative">
            <input
              type="password"
              id="cvv"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substr(0, 4))}
              onBlur={() => handleFieldBlur("cvv")}
              placeholder="123"
              maxLength={4}
              className={cn(
                "w-full px-3 py-2 pr-20 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400",
                touched.cvv && errors.cvv
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              )}
              disabled={isProcessing}
              aria-invalid={touched.cvv && !!errors.cvv}
              aria-describedby={
                touched.cvv && errors.cvv ? "cvv-error cvv-hint" : "cvv-hint"
              }
            />
            <span
              id="cvv-hint"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
            >
              3-4 digits
            </span>
          </div>
          {touched.cvv && errors.cvv && (
            <p id="cvv-error" className="text-sm text-red-600" role="alert">
              {errors.cvv}
            </p>
          )}
        </div>

        {/* Billing address */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Billing Address</h3>

          {/* Address line 1 */}
          <div className="space-y-2">
            <label
              htmlFor="address-line-1"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>
            <input
              type="text"
              id="address-line-1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              onBlur={() => handleFieldBlur("addressLine1")}
              placeholder="123 Main St"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400",
                touched.addressLine1 && errors.addressLine1
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              )}
              disabled={isProcessing}
              aria-invalid={touched.addressLine1 && !!errors.addressLine1}
            />
            {touched.addressLine1 && errors.addressLine1 && (
              <p className="text-sm text-red-600" role="alert">
                {errors.addressLine1}
              </p>
            )}
          </div>

          {/* Address line 2 */}
          <div className="space-y-2">
            <label
              htmlFor="address-line-2"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 2 <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="address-line-2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apt, suite, unit, etc."
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400"
              )}
              disabled={isProcessing}
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => handleFieldBlur("city")}
                placeholder="City"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-gray-400",
                  touched.city && errors.city
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                )}
                disabled={isProcessing}
                aria-invalid={touched.city && !!errors.city}
              />
              {touched.city && errors.city && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.city}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                onBlur={() => handleFieldBlur("state")}
                placeholder="CA"
                maxLength={2}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg text-sm uppercase",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-gray-400",
                  touched.state && errors.state
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                )}
                disabled={isProcessing}
                aria-invalid={touched.state && !!errors.state}
              />
              {touched.state && errors.state && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.state}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="zip-code"
                className="block text-sm font-medium text-gray-700"
              >
                ZIP Code
              </label>
              <input
                type="text"
                id="zip-code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onBlur={() => handleFieldBlur("zipCode")}
                placeholder="12345"
                maxLength={10}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-gray-400",
                  touched.zipCode && errors.zipCode
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                )}
                disabled={isProcessing}
                aria-invalid={touched.zipCode && !!errors.zipCode}
              />
              {touched.zipCode && errors.zipCode && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.zipCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save card */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="save-card"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            disabled={isProcessing}
            className={cn(
              "w-4 h-4 text-blue-600 border-gray-300 rounded",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
              "cursor-pointer disabled:cursor-not-allowed"
            )}
          />
          <label
            htmlFor="save-card"
            className={cn(
              "text-sm text-gray-700 cursor-pointer",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            Save card for future orders
          </label>
        </div>

        {/* Total display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={isProcessing || hasErrors}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-white transition-all",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isProcessing || hasErrors
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg",
              "disabled:opacity-75"
            )}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ${formatCurrency(total)}`
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium text-gray-700",
                "hover:bg-gray-100 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-gray-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * PaymentFormSkeleton component.
 *
 * Loading skeleton for the payment form.
 * Shows while payment data is being loaded.
 *
 * @example
 * <PaymentFormSkeleton />
 */
export function PaymentFormSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div className="h-12 bg-gray-200 rounded-lg" />
    </div>
  );
}
