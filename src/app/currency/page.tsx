"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { CURRENCIES, convertCurrency, formatCurrency } from "@/lib/currency";
import { ArrowLeftRight, TrendingUp } from "lucide-react";

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("INR");

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const cleanAmount = (val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) return;
    setAmount(sanitized);
  };

  const numericAmount = parseFloat(amount) || 0;
  const result = convertCurrency(numericAmount, fromCurrency, toCurrency);

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--charcoal)] mb-2 tracking-tight">
            Currency Converter
          </h1>
          <p className="text-[var(--slate)] text-base max-w-md mx-auto">
            Real-time travel exchange calculations with global rate estimation.
          </p>
        </div>

        <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-sm">
          <div className="space-y-5">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-[var(--charcoal-80)] uppercase tracking-wider mb-2">
                Enter Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className="input-field px-4 text-xl font-bold w-full"
                  value={amount}
                  onChange={(e) => cleanAmount(e.target.value)}
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--slate)] text-sm">
                  {fromCurrency}
                </span>
              </div>
            </div>

            {/* Selectors and Swap button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full">
                <label className="block text-xs font-bold text-[var(--charcoal-80)] uppercase tracking-wider mb-1.5">
                  From
                </label>
                <select
                  className="input-field px-3 w-full h-11 text-sm font-semibold cursor-pointer"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:pt-5">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-3 bg-[var(--sage)] border border-[var(--light-sage)] rounded-xl hover:bg-[var(--light-sage)] text-[var(--forest)] transition-all transform active:scale-95 shadow-sm"
                  title="Swap Currencies"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full">
                <label className="block text-xs font-bold text-[var(--charcoal-80)] uppercase tracking-wider mb-1.5">
                  To
                </label>
                <select
                  className="input-field px-3 w-full h-11 text-sm font-semibold cursor-pointer"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Board */}
            <div className="p-6 rounded-xl bg-[var(--sage)] border border-[var(--light-sage)] text-center mt-6 space-y-1">
              <p className="text-xs font-bold text-[var(--forest)] uppercase tracking-wider">
                Converted Amount
              </p>
              <p className="text-3xl font-extrabold text-[var(--charcoal)] tracking-tight">
                {formatCurrency(result, toCurrency)}
              </p>
              <p className="text-xs text-[var(--slate)]">
                1 {fromCurrency} = {formatCurrency(convertCurrency(1, fromCurrency, toCurrency), toCurrency)}
              </p>
            </div>
          </div>
        </div>

        {/* Informational Rates Card */}
        <div className="max-w-xl mx-auto mt-6 p-4 rounded-xl bg-white border border-[var(--light-sage)] flex items-start gap-3 shadow-sm">
          <TrendingUp className="w-5 h-5 text-[var(--forest)] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[var(--slate)]">
            <span className="font-bold text-[var(--charcoal)] block mb-0.5">Exchange Rates Notice</span>
            Rates are updated periodically relative to the base currency (INR). Designed for trip budgeting and estimated spending throughout your journeys.
          </div>
        </div>
      </main>
    </div>
  );
}
