"use client";

import React, { useState } from "react";
import { type Expense, type TripData } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { updateTrip } from "@/lib/db";
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Hotel,
  Utensils,
  Bus,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  X,
  Check,
  Calendar,
  CreditCard,
  PieChart
} from "lucide-react";

const CATEGORIES = [
  { value: "hotel", label: "Hotel", icon: Hotel, color: "text-[var(--forest)]" },
  { value: "food", label: "Food", icon: Utensils, color: "text-[var(--emerald)]" },
  { value: "transport", label: "Transport", icon: Bus, color: "text-[var(--teal)]" },
  { value: "activity", label: "Activity", icon: Ticket, color: "text-[#7A5C00]" },
  { value: "shopping", label: "Shopping", icon: ShoppingBag, color: "text-[#854D0E]" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-[var(--slate)]" },
] as const;

interface ExpenseTrackerProps {
  trip: TripData;
  onUpdate?: (expenses: Expense[]) => void;
}

export default function ExpenseTracker({ trip, onUpdate }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(trip.expenses || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "food" as Expense["category"],
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const currency = trip.currency || "INR";
  const plannedBudget = trip.budget || 0;
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = Math.max(0, plannedBudget - totalSpent);
  const isOverBudget = totalSpent > plannedBudget;
  const overAmount = isOverBudget ? totalSpent - plannedBudget : 0;
  const percentSpent = plannedBudget > 0 ? Math.min(100, Math.round((totalSpent / plannedBudget) * 100)) : 0;

  const saveExpenses = async (updated: Expense[]) => {
    setExpenses(updated);
    if (trip.id) {
      await updateTrip(trip.id, { expenses: updated });
    }
    onUpdate?.(updated);
  };

  const addExpense = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return alert("Please enter a valid expense amount.");

    const newExpense: Expense = {
      id: "e_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      category: form.category,
      amount,
      currency,
      date: form.date,
      notes: form.notes || undefined,
    };

    saveExpenses([...expenses, newExpense]);
    setForm({ category: "food", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowForm(false);
  };

  const deleteExpense = (id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  };

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + (e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat.value).length,
  }));

  return (
    <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--charcoal)] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[var(--forest)]" />
            Trip Financial Overview & Expense Tracker
          </h3>
          <p className="text-xs text-[var(--slate)] mt-0.5">
            Log your actual trip spending and compare against your planned budget.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs sm:text-sm font-bold flex items-center gap-1.5 py-2.5 px-4 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* ── 4-METRIC FINANCIAL OVERVIEW BAR ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Planned Budget */}
        <div className="p-4 rounded-xl bg-[var(--sage)] border border-[var(--light-sage)]">
          <p className="text-[10px] font-bold text-[var(--forest)] uppercase tracking-wider mb-1">
            Planned Budget
          </p>
          <p className="text-xl font-extrabold text-[var(--charcoal)]">
            {formatCurrency(plannedBudget, currency)}
          </p>
          <p className="text-[11px] text-[var(--slate)] mt-1">Total Target</p>
        </div>

        {/* 2. Actual Spending */}
        <div className="p-4 rounded-xl bg-white border border-[var(--light-sage)] shadow-xs">
          <p className="text-[10px] font-bold text-[var(--charcoal)] uppercase tracking-wider mb-1">
            Actual Spending
          </p>
          <p className="text-xl font-extrabold text-[var(--charcoal)] flex items-center gap-1.5">
            {formatCurrency(totalSpent, currency)}
            {isOverBudget && <TrendingUp className="w-4 h-4 text-[var(--error)] shrink-0" />}
          </p>
          <p className="text-[11px] text-[var(--slate)] mt-1">{expenses.length} transaction(s)</p>
        </div>

        {/* 3. Remaining */}
        <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success)]/25">
          <p className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider mb-1">
            Remaining Budget
          </p>
          <p className="text-xl font-extrabold text-[var(--success)]">
            {formatCurrency(remaining, currency)}
          </p>
          <p className="text-[11px] text-[var(--success)]/80 mt-1">Available to spend</p>
        </div>

        {/* 4. Over Budget */}
        <div className={`p-4 rounded-xl border ${isOverBudget ? "bg-[var(--error-bg)] border-[var(--error)]/35" : "bg-[var(--cream)] border-[var(--light-sage)]"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isOverBudget ? "text-[var(--error)]" : "text-[var(--slate)]"}`}>
            Over Budget
          </p>
          <p className={`text-xl font-extrabold ${isOverBudget ? "text-[var(--error)]" : "text-[var(--slate)]"}`}>
            {isOverBudget ? formatCurrency(overAmount, currency) : formatCurrency(0, currency)}
          </p>
          <p className="text-[11px] text-[var(--slate)] mt-1">
            {isOverBudget ? "Exceeded target" : "Within limits"}
          </p>
        </div>
      </div>

      {/* ── BUDGET UTILIZATION PROGRESS INDICATOR ─────────────── */}
      <div className="bg-[var(--cream)] p-4 rounded-xl border border-[var(--light-sage)] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--charcoal)]">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-[var(--forest)]" />
            Budget Utilization Progress
          </span>
          <span className={isOverBudget ? "text-[var(--error)] font-extrabold" : "text-[var(--forest)] font-extrabold"}>
            {percentSpent}% Spent
          </span>
        </div>
        <div className="w-full bg-[var(--light-sage)] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? "bg-[var(--error)]" : percentSpent > 80 ? "bg-[var(--warning)]" : "bg-[var(--forest)]"
            }`}
            style={{ width: `${Math.min(100, percentSpent)}%` }}
          />
        </div>
      </div>

      {/* ── CATEGORY EXPENSE SUMMARY ──────────────────────────── */}
      {categoryTotals.some(c => c.total > 0) && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
            Category Spending Distribution
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categoryTotals.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.value} className="p-3 rounded-xl bg-[var(--cream)] border border-[var(--light-sage)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span className="text-xs font-bold text-[var(--charcoal)]">{cat.label}</span>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--charcoal)]">{formatCurrency(cat.total, currency)}</p>
                  <p className="text-[10px] text-[var(--slate)]">{cat.count} entry(ies)</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD EXPENSE FORM MODAL / PANEL ─────────────────────── */}
      {showForm && (
        <div className="p-5 rounded-2xl bg-[var(--sage)] border border-[var(--light-sage)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--light-sage)]">
            <h4 className="text-sm font-extrabold text-[var(--forest)] uppercase tracking-wider">
              Log a New Trip Expense
            </h4>
            <button onClick={() => setShowForm(false)} className="text-[var(--slate)] hover:text-[var(--charcoal)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--charcoal)] mb-1.5 block">Category</label>
              <select
                className="input-field py-2 text-sm font-semibold cursor-pointer"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as Expense["category"] })}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--charcoal)] mb-1.5 block">Amount ({currency})</label>
              <input
                type="text"
                inputMode="decimal"
                className="input-field py-2 text-sm font-bold"
                placeholder="0.00"
                value={form.amount}
                onChange={e => {
                  const sanitized = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = sanitized.split(".");
                  if (parts.length <= 2) setForm({ ...form, amount: sanitized });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--charcoal)] mb-1.5 block">Date of Expense</label>
              <input
                type="date"
                className="input-field py-2 text-sm"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--charcoal)] mb-1.5 block">Description / Notes</label>
              <input
                type="text"
                className="input-field py-2 text-sm"
                placeholder="e.g. Seafood dinner at harbor"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-2 px-4">
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </button>
            <button onClick={addExpense} className="btn-primary text-xs py-2 px-5 font-bold">
              <Check className="w-3.5 h-3.5 mr-1" /> Save Entry
            </button>
          </div>
        </div>
      )}

      {/* ── EXPENSE LOG LIST ───────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
          Recent Expense Transactions
        </h4>

        {expenses.length > 0 ? (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
              const catInfo = CATEGORIES.find(c => c.value === exp.category);
              const Icon = catInfo?.icon || MoreHorizontal;
              return (
                <div key={exp.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--light-sage)] group hover:border-[var(--emerald)] hover:bg-white transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-[var(--light-sage)] shrink-0">
                    <Icon className={`w-4 h-4 ${catInfo?.color || "text-[var(--slate)]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--charcoal)] truncate">{catInfo?.label || exp.category}</p>
                    <p className="text-xs text-[var(--slate)] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />{exp.date}
                      {exp.notes && <span className="truncate">• {exp.notes}</span>}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-[var(--charcoal)] whitespace-nowrap px-2">
                    {formatCurrency(exp.amount, currency)}
                  </p>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 bg-[var(--error-bg)] text-[var(--error)] rounded-lg hover:bg-red-200 transition-all shrink-0"
                    title="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--slate)] bg-[var(--cream)] rounded-xl border border-[var(--light-sage)]">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30 text-[var(--forest)]" />
            <p className="text-xs sm:text-sm font-medium">No expenses logged yet. Click Add Expense to record your spending.</p>
          </div>
        )}
      </div>
    </div>
  );
}
