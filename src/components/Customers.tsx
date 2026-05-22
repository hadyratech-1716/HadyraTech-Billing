"use client";

import React, { useState, useMemo } from "react";
import { useDb, Customer } from "@/context/DbContext";
import { 
  Users, Search, Plus, Edit2, Phone, Mail, Award, 
  IndianRupee, ChevronRight, FileText, CheckCircle2, ArrowRightLeft, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Customers() {
  const { 
    activeBusiness, customers, invoices, addCustomer, updateCustomer, adjustCustomerBalance 
  } = useDb();

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected Details Panel
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Modals
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [payAmount, setPayAmount] = useState(0);

  // Filter customers by business
  const businessCustomers = useMemo(() => {
    return customers.filter(c => c.business_id === activeBusiness?.id);
  }, [customers, activeBusiness]);

  const filteredCustomers = useMemo(() => {
    return businessCustomers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [businessCustomers, searchQuery]);

  // Selected customer purchase ledger
  const customerInvoices = useMemo(() => {
    if (!selectedCust) return [];
    return invoices.filter(inv => inv.customer_id === selectedCust.id);
  }, [invoices, selectedCust]);

  // Open forms
  const handleOpenAddModal = () => {
    setEditingCust(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setGstNumber("");
    setShowCustModal(true);
  };

  const handleOpenEditModal = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCust(cust);
    setName(cust.name);
    setPhone(cust.phone || "");
    setEmail(cust.email || "");
    setAddress(cust.address || "");
    setGstNumber(cust.gst_number || "");
    setShowCustModal(true);
  };

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    const custData = {
      name,
      phone,
      email,
      address,
      gst_number: gstNumber
    };

    if (editingCust) {
      updateCustomer(editingCust.id, custData);
      if (selectedCust && selectedCust.id === editingCust.id) {
        setSelectedCust({ ...selectedCust, ...custData });
      }
    } else {
      addCustomer(custData);
    }
    setShowCustModal(false);
  };

  // Record credit payment
  const handleRecordCreditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || payAmount <= 0) return;

    // Adjust balance (reduce debt)
    adjustCustomerBalance(selectedCust.id, -payAmount);
    
    // Sync immediate panel view
    setSelectedCust(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - payAmount) } : null);
    
    setShowPayModal(false);
    setPayAmount(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">Customer Relations Ledger</h1>
          <p className="text-xs md:text-sm text-brand-gray">Audit buyer purchase logs, track credit dues, and loyalty systems.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-brand-blue/20"
        >
          <Plus className="w-4 h-4" />
          Add Client Profile
        </button>
      </div>

      {/* Main Grid: Left Directory, Right Details Inspect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Directory search list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search directory by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
            />
          </div>

          <div className="glass-panel rounded-3xl p-3 max-h-[460px] overflow-y-auto space-y-1.5">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => {
                const isSelected = selectedCust?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCust(c)}
                    className={`p-3 rounded-2xl cursor-pointer text-xs transition-all flex justify-between items-center ${
                      isSelected 
                        ? "bg-[#071B3B]/60 border border-brand-blue/30 text-white shadow-md shadow-brand-blue/5" 
                        : "border border-transparent text-slate-350 hover:bg-slate-900/40 hover:text-white"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-200 block truncate">{c.name}</span>
                      <span className="text-[10px] text-brand-gray font-mono">{c.phone || "No Phone Contact"}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {c.balance > 0 ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          Due: ₹{c.balance.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-brand-gray text-xs py-8">No matching clients found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Ledger Inspector Details */}
        <div className="lg:col-span-2">
          {selectedCust ? (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-6"
            >
              {/* Profile Card Summary */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={(e) => handleOpenEditModal(selectedCust, e)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray hover:text-white hover:border-slate-700 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-b border-slate-950 pb-5 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-navy border border-brand-blue/30 text-brand-blue flex items-center justify-center font-display font-extrabold text-lg">
                    {selectedCust.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">{selectedCust.name}</h3>
                    {selectedCust.gst_number && (
                      <span className="text-[10px] text-brand-blue font-bold tracking-wider font-mono">
                        GSTIN: {selectedCust.gst_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl">
                    <span className="text-[9px] text-brand-gray font-bold block uppercase tracking-wider mb-1">Dues Outstanding</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-md font-bold font-mono ${selectedCust.balance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        ₹{selectedCust.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      {selectedCust.balance > 0 && (
                        <button
                          onClick={() => setShowPayModal(true)}
                          className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded text-[10px] hover:bg-rose-500/20 transition"
                        >
                          Clear Dues
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-brand-gray font-bold block uppercase tracking-wider mb-1">Loyalty Points</span>
                      <span className="text-md font-bold text-slate-100 font-mono mt-1 block">
                        {selectedCust.loyalty_points} Points
                      </span>
                    </div>
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl">
                    <span className="text-[9px] text-brand-gray font-bold block uppercase tracking-wider mb-1">Contact Channels</span>
                    <div className="mt-2 space-y-1 text-[11px] text-brand-gray">
                      {selectedCust.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-brand-blue" />{selectedCust.phone}</p>}
                      {selectedCust.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-brand-blue" />{selectedCust.email}</p>}
                    </div>
                  </div>
                </div>

                {selectedCust.address && (
                  <div className="mt-4 pt-3 border-t border-slate-950 text-[10px] text-brand-gray">
                    <span className="font-bold text-slate-350 block mb-1">SHIPPING/BILLING ADDRESS</span>
                    <p>{selectedCust.address}</p>
                  </div>
                )}
              </div>

              {/* Transactions Ledger Panel */}
              <div className="glass-panel rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-950 pb-3">
                  <ArrowRightLeft className="w-4.5 h-4.5 text-brand-blue" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Purchase History Ledger</h4>
                </div>

                <div className="space-y-3">
                  {customerInvoices.length > 0 ? (
                    customerInvoices.map(inv => (
                      <div key={inv.id} className="p-3 bg-slate-950/30 border border-slate-900 rounded-2xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-200 block">{inv.invoice_number}</span>
                          <span className="text-[10px] text-brand-gray">{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-bold text-slate-200 block">₹{inv.total_amount.toFixed(2)}</span>
                            <span className="text-[9px] text-brand-gray">Paid: ₹{inv.amount_paid.toFixed(2)}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            inv.payment_status === "paid" 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : inv.payment_status === "partial"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {inv.payment_status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-brand-gray text-xs py-6 italic">No purchases recorded for this customer.</p>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] glass-panel rounded-3xl flex flex-col items-center justify-center text-brand-gray p-8 text-center border border-dashed border-slate-800">
              <Users className="w-12 h-12 text-slate-800 mb-3 animate-pulse-subtle" />
              <h3 className="font-bold text-slate-300 font-display">No Buyer Selected</h3>
              <p className="text-xs max-w-sm mt-1">Select a customer from the left directory to examine billing history and clear credits.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {showCustModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">
                {editingCust ? "Edit Customer Profile" : "Register Customer Profile"}
              </h3>

              <form onSubmit={handleSubmitCustomer} className="space-y-4 text-xs">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Customer / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="M/s Tata Motors Ltd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Contact row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 99887 76655"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">GSTIN Registration</label>
                    <input
                      type="text"
                      placeholder="27AAACG9012F1Z9"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Work Email</label>
                  <input
                    type="email"
                    placeholder="finance@tata.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Shipping address */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Shipping / Billing Address</label>
                  <textarea
                    rows={3}
                    placeholder="Tata Towers, Gate No 4, Worli, Mumbai 400018"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl glass-input focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowCustModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-brand-gray font-semibold rounded-xl hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(10,108,255,0.3)]"
                  >
                    Save Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Cash Credit Payment Modal */}
      <AnimatePresence>
        {showPayModal && selectedCust && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Record Due Payment</h3>
                  <span className="text-[10px] text-brand-gray">Reduces debtor balance for {selectedCust.name}</span>
                </div>
                <button onClick={() => setShowPayModal(false)} className="text-brand-gray hover:text-white">✕</button>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-xs flex justify-between">
                <span>Total Debt Outstanding:</span>
                <span className="font-bold text-rose-450">₹{selectedCust.balance.toFixed(2)}</span>
              </div>

              <form onSubmit={handleRecordCreditPayment} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Payment Amount Collected (₹)</label>
                  <input
                    type="number"
                    max={selectedCust.balance}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-brand-gray font-semibold rounded-xl hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                  >
                    Record Cash Pay
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
