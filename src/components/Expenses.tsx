"use client";

import React, { useState, useMemo } from "react";
import { useDb, Expense } from "@/context/DbContext";
import { Receipt, Search, Plus, Trash2, Calendar, IndianRupee, PieChart, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Expenses() {
  const { activeBusiness, expenses, addExpense, deleteExpense } = useDb();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Office Rent");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const categoriesList = [
    "Office Rent",
    "Electricity & Water",
    "Salaries & Wages",
    "Internet & IT Services",
    "Shipping & Logistics",
    "Office Supplies",
    "Marketing & Adverts",
    "Miscellaneous"
  ];

  // Filter expenses by business
  const businessExpenses = useMemo(() => {
    return expenses.filter(e => e.business_id === activeBusiness?.id);
  }, [expenses, activeBusiness]);

  const filteredExpenses = useMemo(() => {
    return businessExpenses.filter(e => {
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchSearch = e.description?.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [businessExpenses, searchQuery, categoryFilter]);

  // Aggregate sums by category
  const expenseSummary = useMemo(() => {
    const sums: { [key: string]: number } = {};
    categoriesList.forEach(cat => { sums[cat] = 0; });
    
    let total = 0;
    businessExpenses.forEach(e => {
      if (e.category in sums) {
        sums[e.category] += e.amount;
      } else {
        sums[e.category] = e.amount;
      }
      total += e.amount;
    });

    return {
      total,
      breakdown: Object.entries(sums).map(([cat, sum]) => ({
        category: cat,
        amount: sum,
        percentage: total > 0 ? (sum / total) * 100 : 0
      })).sort((a, b) => b.amount - a.amount)
    };
  }, [businessExpenses]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addExpense({
      amount: Number(amount),
      category,
      description,
      date,
      payment_method: paymentMethod
    });

    // Reset forms
    setShowAddModal(false);
    setAmount(0);
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">Expenses Tracker</h1>
          <p className="text-xs md:text-sm text-brand-gray">Log overhead costs, analyze category cost shares, and audit profit margins.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-brand-blue/20"
        >
          <Plus className="w-4 h-4" />
          Log Expense Record
        </button>
      </div>

      {/* Grid: Left breakdown stats, Right list registry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Distribution Analysis */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-950 pb-3">
              <PieChart className="w-4.5 h-4.5 text-brand-blue" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Expense Distribution</h4>
            </div>

            <div className="text-center py-2">
              <span className="text-[10px] text-brand-gray font-bold block uppercase tracking-wide">AGGREGATED EXPENSES</span>
              <span className="text-2xl font-extrabold text-white font-display">₹{expenseSummary.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-3.5 pt-2">
              {expenseSummary.breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{item.category}</span>
                    <span className="text-slate-200">₹{item.amount.toLocaleString("en-IN")} ({item.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-955 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-blue rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Ledger Registry List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search toolbar */}
          <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search expense description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
            
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl glass-input appearance-none text-slate-250 font-semibold cursor-pointer"
              >
                <option value="all">Category: All</option>
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-brand-gray uppercase tracking-wider font-bold">
                    <th className="p-4">Expense details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Log Date</th>
                    <th className="p-4 text-right">Paid Sum</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 text-slate-350">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-955/15 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-250 block">{e.description || "N/A"}</span>
                              <span className="text-[9px] text-brand-gray uppercase font-semibold font-mono">{e.payment_method.replace(/_/g, " ")} wire</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-300">
                          {e.category}
                        </td>
                        <td className="p-4 text-center">
                          <span className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            <Calendar className="w-3.5 h-3.5 text-brand-gray" />
                            {new Date(e.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 text-right font-extrabold text-slate-200">
                          ₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Remove logged expense of ₹${e.amount}?`)) {
                                deleteExpense(e.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-brand-gray hover:text-rose-450 transition"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-brand-gray">
                        <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-800 animate-pulse-subtle" />
                        No logged expense records found in cache.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Add Expense Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">Log Store Expense</h3>
              
              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                
                {/* Cost Amount */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Expense Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="12000"
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold"
                  />
                </div>

                {/* Category & Payment wire */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Overhead Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                    >
                      {categoriesList.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                    >
                      <option value="bank_transfer">Bank Wire</option>
                      <option value="cash">Petty Cash Registry</option>
                      <option value="card">Company Debit Card</option>
                      <option value="upi">UPI Scan Payment</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Payment Settlement Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Expense Description / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="E.g. internet wire installation fees for front registry desk..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl glass-input focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-brand-gray font-semibold rounded-xl hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(10,108,255,0.3)]"
                  >
                    Save Record
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
