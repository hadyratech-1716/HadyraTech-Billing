"use client";

import React, { useState, useMemo } from "react";
import { useDb } from "@/context/DbContext";
import { Search, Printer, Share2, Trash2, Calendar, FileText, ChevronRight } from "lucide-react";

interface InvoicesListProps {
  onPrintInvoice: (invoiceId: string) => void;
  onShareInvoice: (invoiceId: string) => void;
}

export default function InvoicesList({ onPrintInvoice, onShareInvoice }: InvoicesListProps) {
  const { invoices, customers, activeBusiness, deleteInvoice } = useDb();
  
  // Search and status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter invoices belonging to active business
  const businessInvoices = useMemo(() => {
    return invoices.filter(inv => inv.business_id === activeBusiness?.id);
  }, [invoices, activeBusiness]);

  // Apply filters
  const filteredInvoices = useMemo(() => {
    return businessInvoices.filter(inv => {
      const matchStatus = statusFilter === "all" || inv.payment_status === statusFilter;
      
      // Find customer name for matching search
      const customerMatch = customers.find(c => c.id === inv.customer_id);
      const customerName = customerMatch ? customerMatch.name.toLowerCase() : "cash sale";

      const matchSearch = 
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [businessInvoices, searchQuery, statusFilter, customers]);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">Invoices Register</h1>
          <p className="text-xs md:text-sm text-brand-gray">Audit all customer bills, print receipt slips, and record payment balances.</p>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="relative md:col-span-2">
          <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search register by invoice number, buyer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl glass-input appearance-none font-semibold text-slate-200 cursor-pointer"
          >
            <option value="all">Payment Status: All</option>
            <option value="paid">Fully Settled</option>
            <option value="partial">Partial Payments</option>
            <option value="unpaid">Unpaid Dues</option>
          </select>
          <ChevronRight className="w-4 h-4 text-brand-gray absolute right-3 top-3.5 rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* Invoices register list */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-brand-gray uppercase tracking-wider font-bold">
                <th className="p-4">Invoice Details</th>
                <th className="p-4">Buyer Customer</th>
                <th className="p-4 text-center">Billing Date</th>
                <th className="p-4 text-right">Invoice Amount</th>
                <th className="p-4 text-right">Settled Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Action Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950 text-xs text-slate-350">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const buyer = customers.find(c => c.id === inv.customer_id);
                  const isPaid = inv.payment_status === "paid";
                  const isPartial = inv.payment_status === "partial";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-950/15 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">{inv.invoice_number}</span>
                            <span className="text-[9px] text-brand-gray uppercase font-semibold font-mono">{inv.payment_method} Registry</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {buyer ? (
                          <div>
                            <span className="font-bold text-slate-300 block">{buyer.name}</span>
                            <span className="text-[10px] text-brand-gray font-mono">{buyer.phone || "No phone contact"}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Cash Walk-In Buyer</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        <span className="flex items-center justify-center gap-1.5 font-mono text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-brand-gray" />
                          {new Date(inv.invoice_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-200">
                        ₹{inv.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-350">
                        ₹{inv.amount_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isPaid 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : isPartial 
                            ? "bg-amber-500/10 text-amber-400" 
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            onClick={() => onPrintInvoice(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray hover:text-white hover:border-slate-700 transition"
                            title="Print Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onShareInvoice(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray hover:text-white hover:border-slate-700 transition"
                            title="WhatsApp / Email Notify"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Void/Delete Invoice record ${inv.invoice_number}? This action resets client dues balances and returns item stocks.`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-brand-gray hover:text-rose-400 transition"
                            title="Void Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-brand-gray">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                    No logged invoices found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
