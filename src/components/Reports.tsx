"use client";

import React, { useState, useMemo } from "react";
import { useDb } from "@/context/DbContext";
import { BarChart3, Download, Calendar, ArrowRightLeft, ShieldAlert, Check } from "lucide-react";

export default function Reports() {
  const { activeBusiness, invoices, products, expenses, customers } = useDb();
  
  // Selected Report Panel
  const [selectedReport, setSelectedReport] = useState<"gst" | "pl" | "sales" | "inventory">("gst");

  // Filter arrays
  const businessInvoices = useMemo(() => {
    return invoices.filter(inv => inv.business_id === activeBusiness?.id);
  }, [invoices, activeBusiness]);

  const businessProducts = useMemo(() => {
    return products.filter(prod => prod.business_id === activeBusiness?.id);
  }, [products, activeBusiness]);

  const businessExpenses = useMemo(() => {
    return expenses.filter(exp => exp.business_id === activeBusiness?.id);
  }, [expenses, activeBusiness]);

  // Calculations for reports
  const reportData = useMemo(() => {
    let salesTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let cogsTotal = 0;

    businessInvoices.forEach(inv => {
      salesTotal += inv.total_amount;
      taxTotal += inv.tax_amount;
      discountTotal += inv.discount_amount;
      
      // COGS
      if (inv.items) {
        inv.items.forEach(item => {
          const match = businessProducts.find(p => p.id === item.product_id);
          if (match) {
            cogsTotal += (match.purchase_price * item.quantity);
          }
        });
      }
    });

    const expensesTotal = businessExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const grossProfit = salesTotal - cogsTotal;
    const netProfit = grossProfit - expensesTotal;

    const inventoryVal = businessProducts.reduce((acc, curr) => acc + (curr.sales_price * curr.stock_quantity), 0);
    const inventoryCost = businessProducts.reduce((acc, curr) => acc + (curr.purchase_price * curr.stock_quantity), 0);

    return {
      salesTotal,
      taxTotal,
      discountTotal,
      cogsTotal,
      expensesTotal,
      grossProfit,
      netProfit,
      inventoryVal,
      inventoryCost
    };
  }, [businessInvoices, businessProducts, businessExpenses]);

  // CSV Exporter
  const handleExportCSV = () => {
    let headers = "";
    let rows = "";
    let filename = "";

    if (selectedReport === "gst") {
      filename = `GSTR1_AUDIT_${activeBusiness?.invoice_prefix}`;
      headers = "Invoice No,Date,Customer Name,Customer GSTIN,Subtotal Value,Tax Rate %,CGST Split (₹),SGST Split (₹),IGST Split (₹),Total Billing\n";
      rows = businessInvoices.map(inv => {
        const buyer = customers.find(c => c.id === inv.customer_id);
        const name = buyer ? buyer.name : "Walk-in Cash sale";
        const gstin = buyer ? buyer.gst_number || "" : "";
        const isInterstate = false; // Mock default SGST/CGST split
        const cgst = isInterstate ? 0 : inv.tax_amount / 2;
        const sgst = isInterstate ? 0 : inv.tax_amount / 2;
        const igst = isInterstate ? inv.tax_amount : 0;
        
        return `"${inv.invoice_number}","${inv.invoice_date}","${name}","${gstin}",${inv.subtotal},18.00,${cgst},${sgst},${igst},${inv.total_amount}`;
      }).join("\n");
    } 
    else if (selectedReport === "sales") {
      filename = `SALES_REGISTER_${activeBusiness?.invoice_prefix}`;
      headers = "Invoice No,Date,Buyer Name,Subtotal,Tax Value,Discount,Total Paid,Status,Payment Mode\n";
      rows = businessInvoices.map(inv => {
        const buyer = customers.find(c => c.id === inv.customer_id);
        const name = buyer ? buyer.name : "Walk-in Cash sale";
        return `"${inv.invoice_number}","${inv.invoice_date}","${name}",${inv.subtotal},${inv.tax_amount},${inv.discount_amount},${inv.total_amount},"${inv.payment_status}","${inv.payment_method}"`;
      }).join("\n");
    }
    else if (selectedReport === "inventory") {
      filename = `STOCK_VALUATION_${activeBusiness?.invoice_prefix}`;
      headers = "Product Title,SKU,Barcode,Category,Cost Price,Sales Price,GST %,Current Stock,VALUATION AT COST,VALUATION AT SALES\n";
      rows = businessProducts.map(p => {
        return `"${p.name}","${p.sku || ""}","${p.barcode || ""}","${p.category}",${p.purchase_price},${p.sales_price},${p.tax_rate},${p.stock_quantity},${p.purchase_price * p.stock_quantity},${p.sales_price * p.stock_quantity}`;
      }).join("\n");
    }
    else {
      filename = `PROFIT_LOSS_REPORT_${activeBusiness?.invoice_prefix}`;
      headers = "Financial Item,Account Code,Debit (₹),Credit (₹),Total (₹)\n";
      rows = [
        `"Gross Sales Billing","4000",0,${reportData.salesTotal},${reportData.salesTotal}`,
        `"Cost of Goods Sold (COGS)","5000",${reportData.cogsTotal},0,-${reportData.cogsTotal}`,
        `"Gross Profit Balance","",0,0,${reportData.grossProfit}`,
        `"Logged Store Overhead Expenses","6000",${reportData.expensesTotal},0,-${reportData.expensesTotal}`,
        `"Net Operating Profit Balance","",0,0,${reportData.netProfit}`
      ].join("\n");
    }

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">Financial Auditing Reports</h1>
          <p className="text-xs md:text-sm text-brand-gray">Review balance sheets, evaluate inventory costs, and export GST formats.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-brand-blue/20"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Selector Toolbar */}
      <div className="flex bg-slate-950 border border-slate-900 rounded-2xl p-1.5 overflow-x-auto text-xs">
        {[
          { id: "gst", label: "GST Audits (GSTR-1)" },
          { id: "pl", label: "Profit & Loss Account" },
          { id: "sales", label: "Sales Registry logs" },
          { id: "inventory", label: "Inventory Valuation sheet" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedReport === tab.id 
                ? "bg-[#0A6CFF] text-white shadow-md shadow-brand-blue/15" 
                : "text-brand-gray hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Rendering sheets */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-6">
        
        {selectedReport === "gst" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-950">
              <h3 className="text-sm font-bold text-white font-display">GSTR-1 Tax Billing Summary</h3>
              <span className="text-[10px] text-brand-blue font-bold font-mono">GST Tiers: 5%, 12%, 18%, 28%</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-brand-gray uppercase text-[10px] font-bold">
                    <th className="py-2.5 pr-2">Invoice No</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Client Name</th>
                    <th className="py-2.5 px-2">Client GSTIN</th>
                    <th className="py-2.5 px-2 text-right">Taxable Val (₹)</th>
                    <th className="py-2.5 px-2 text-right">CGST (50%)</th>
                    <th className="py-2.5 px-2 text-right">SGST (50%)</th>
                    <th className="py-2.5 pl-2 text-right">Gross Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 text-slate-350">
                  {businessInvoices.length > 0 ? (
                    businessInvoices.map((inv) => {
                      const buyer = customers.find(c => c.id === inv.customer_id);
                      const name = buyer ? buyer.name : "Walk-in Registry Cash Sale";
                      const cgst = inv.tax_amount / 2;
                      const sgst = inv.tax_amount / 2;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-950/10">
                          <td className="py-3 pr-2 font-bold text-slate-200 font-mono">{inv.invoice_number}</td>
                          <td className="py-3 px-2 font-mono text-[10px]">{inv.invoice_date}</td>
                          <td className="py-3 px-2 font-semibold">{name}</td>
                          <td className="py-3 px-2 font-mono text-slate-400">{buyer?.gst_number || "Unregistered"}</td>
                          <td className="py-3 px-2 text-right">₹{inv.subtotal.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right text-slate-450">₹{cgst.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right text-slate-450">₹{sgst.toFixed(2)}</td>
                          <td className="py-3 pl-2 text-right font-bold text-slate-100">₹{inv.total_amount.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-brand-gray">No invoices logged for GSTR audit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === "pl" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white font-display border-b border-slate-950 pb-3">Profit & Loss Statement</h3>
            
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              
              {/* Gross income */}
              <div className="flex justify-between items-center p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                <div>
                  <span className="font-bold text-slate-250 block">1. Gross Revenue Sales</span>
                  <span className="text-[10px] text-brand-gray">Credits of all invoices issued</span>
                </div>
                <span className="font-bold text-md text-emerald-400 font-mono">₹{reportData.salesTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* COGS */}
              <div className="flex justify-between items-center p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                <div>
                  <span className="font-bold text-slate-250 block">2. Less: Cost of Goods Sold (COGS)</span>
                  <span className="text-[10px] text-brand-gray">Inventory purchase cost overheads</span>
                </div>
                <span className="font-bold text-md text-rose-400 font-mono">-₹{reportData.cogsTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Gross margin */}
              <div className="flex justify-between items-center p-3.5 bg-brand-navy/30 rounded-xl border border-brand-blue/10">
                <div>
                  <span className="font-bold text-slate-100 block">3. Gross Profit Margin</span>
                  <span className="text-[10px] text-brand-gray">Operating inventory margin returns</span>
                </div>
                <span className="font-bold text-md text-[#0A6CFF] font-mono">₹{reportData.grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Overhead expense */}
              <div className="flex justify-between items-center p-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
                <div>
                  <span className="font-bold text-slate-250 block">4. Less: Logged Store Overhead Expenses</span>
                  <span className="text-[10px] text-brand-gray">Rent, broadband bills, grid salaries</span>
                </div>
                <span className="font-bold text-md text-rose-400 font-mono">-₹{reportData.expensesTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Net operating profits */}
              <div className="flex justify-between items-center p-4 bg-[#0B1329] rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <div>
                  <span className="font-black text-white text-sm block">5. Net Operating Profit</span>
                  <span className="text-[10px] text-brand-gray">Consolidated net business returns</span>
                </div>
                <span className={`text-lg font-black font-mono ${reportData.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ₹{reportData.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

            </div>
          </div>
        )}

        {selectedReport === "sales" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white font-display border-b border-slate-950 pb-3">Sales Register Audits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-brand-gray uppercase text-[10px] font-bold">
                    <th className="py-2.5">Invoice #</th>
                    <th className="py-2.5">Billing Date</th>
                    <th className="py-2.5">Buyer name</th>
                    <th className="py-2.5 text-right">Subtotal Value (₹)</th>
                    <th className="py-2.5 text-right">Taxes Value (₹)</th>
                    <th className="py-2.5 text-right">Bill Discount</th>
                    <th className="py-2.5 text-right">Net Value Paid (₹)</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 text-slate-350">
                  {businessInvoices.length > 0 ? (
                    businessInvoices.map((inv) => {
                      const buyer = customers.find(c => c.id === inv.customer_id);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-950/10">
                          <td className="py-3 font-bold text-slate-200 font-mono">{inv.invoice_number}</td>
                          <td className="py-3 font-mono text-[10px]">{inv.invoice_date}</td>
                          <td className="py-3 font-semibold">{buyer?.name || "Walk-in Cash Sale"}</td>
                          <td className="py-3 text-right">₹{inv.subtotal.toFixed(2)}</td>
                          <td className="py-3 text-right">₹{inv.tax_amount.toFixed(2)}</td>
                          <td className="py-3 text-right text-rose-450">-₹{inv.discount_amount.toFixed(2)}</td>
                          <td className="py-3 text-right font-bold text-slate-100">₹{inv.total_amount.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              inv.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {inv.payment_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-brand-gray">No invoices logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === "inventory" && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-950 gap-4">
              <h3 className="text-sm font-bold text-white font-display">Inventory Assets Evaluation</h3>
              <div className="flex gap-4 text-xs font-mono text-brand-gray">
                <p>Valuation at Cost: <strong className="text-slate-200">₹{reportData.inventoryCost.toLocaleString("en-IN")}</strong></p>
                <p>Valuation at Retail: <strong className="text-[#0A6CFF]">₹{reportData.inventoryVal.toLocaleString("en-IN")}</strong></p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-brand-gray uppercase text-[10px] font-bold">
                    <th className="py-2.5">Product catalog details</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Cost Price (₹)</th>
                    <th className="py-2.5 text-right">Retail Price (₹)</th>
                    <th className="py-2.5 text-center">Current Stock</th>
                    <th className="py-2.5 text-right">Valuation at Retail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 text-slate-350">
                  {businessProducts.length > 0 ? (
                    businessProducts.map((p) => {
                      const valuation = p.stock_quantity * p.sales_price;
                      return (
                        <tr key={p.id} className="hover:bg-slate-950/10">
                          <td className="py-3">
                            <span className="font-bold text-slate-200 block">{p.name}</span>
                            <span className="text-[9px] text-brand-gray font-mono">SKU: {p.sku || "N/A"}</span>
                          </td>
                          <td className="py-3 font-semibold text-slate-300">{p.category}</td>
                          <td className="py-3 text-right">₹{p.purchase_price.toFixed(2)}</td>
                          <td className="py-3 text-right">₹{p.sales_price.toFixed(2)}</td>
                          <td className="py-3 text-center font-mono font-bold text-slate-100">{p.stock_quantity}</td>
                          <td className="py-3 text-right font-bold text-[#0A6CFF]">₹{valuation.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-brand-gray">No products catalogued.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
