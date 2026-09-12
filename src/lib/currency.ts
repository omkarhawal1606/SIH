export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" }
];

// Base currency is INR (since the original app was hardcoded to ₹)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  JPY: 1.80
};

export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  if (fromCode === toCode) return amount;
  
  // Convert from "fromCode" to INR (base), then to "toCode"
  const amountInINR = amount / (EXCHANGE_RATES[fromCode] || 1);
  const amountInTarget = amountInINR * (EXCHANGE_RATES[toCode] || 1);
  
  return amountInTarget;
}

export function formatCurrency(amount: number, currencyCode: string = "INR"): string {
  const code = currencyCode.toUpperCase();
  // Safe default formatting if Intl.NumberFormat fails
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch (e) {
    const symbol = CURRENCIES.find(c => c.code === code)?.symbol || code;
    return `${symbol}${amount.toLocaleString()}`;
  }
}
