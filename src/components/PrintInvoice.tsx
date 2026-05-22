"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDb } from "@/context/DbContext";
import { Printer, X, FileText, Smartphone, CreditCard, Building } from "lucide-react";

interface PrintInvoiceProps {
  invoiceId: string;
  onClose: () => void;
}

export default function PrintInvoice({ invoiceId, onClose }: PrintInvoiceProps) {
  const { invoices, customers, activeBusiness, currentUser } = useDb();
  const [template, setTemplate] = useState<"a4" | "thermal">("a4");

  const [upiId, setUpiId] = useState("6048894526@KKBK0008488.ifsc.npci");
  const [bankDetails, setBankDetails] = useState(`👋 Hello! Here are my account details:
1️⃣ A/c no.: 6048894526
2️⃣ IFSC Code: KKBK0008488
3️⃣ Home branch: ANNA NAGAR, CHENNAI`);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUpi = localStorage.getItem("hadyra_merchant_upi");
      if (storedUpi) setUpiId(storedUpi);
      const storedBank = localStorage.getItem("hadyra_bank_details");
      if (storedBank) setBankDetails(storedBank);
    }
  }, []);

  // Find invoice details
  const invoice = useMemo(() => {
    return invoices.find((inv) => inv.id === invoiceId);
  }, [invoices, invoiceId]);

  const customer = useMemo(() => {
    if (!invoice || !invoice.customer_id) return null;
    return customers.find((c) => c.id === invoice.customer_id);
  }, [customers, invoice]);

  if (!invoice) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-sm mx-auto">
        <p className="text-red-400 text-sm font-semibold mb-3">Invoice records not found.</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-white">
          Close View
        </button>
      </div>
    );
  }

  // Trigger Browser Print Command
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center p-4 no-print-bg">
      
      {/* Top Controller Bar - Hidden in print */}
      <div className="no-print w-full max-w-4xl bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-brand-blue/10 text-brand-blue">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Invoice Printer Controller</h3>
            <span className="text-[10px] text-brand-gray font-mono">Invoice Number: {invoice.invoice_number}</span>
          </div>
        </div>

        {/* Format triggers */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setTemplate("a4")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                template === "a4" ? "bg-brand-blue text-white" : "text-brand-gray hover:text-slate-200"
              }`}
            >
              Standard A4 Page
            </button>
            <button
              onClick={() => setTemplate("thermal")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                template === "thermal" ? "bg-brand-blue text-white" : "text-brand-gray hover:text-slate-200"
              }`}
            >
              3" POS Thermal
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-500/15"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-brand-gray hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render selected format */}
      {template === "a4" ? (
        
        /* A4 Elegant Business Invoice Template */
        <div className="w-full max-w-4xl bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm border border-slate-200 font-sans min-h-[11in] flex flex-col justify-between">
          <div>
            
            {/* Invoice Top Meta: Logo and Seller Info */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">
                  {activeBusiness?.name}
                </h1>
                <div className="text-[11px] text-slate-500 space-y-0.5 mt-2">
                  <p>{activeBusiness?.address}</p>
                  <p>GSTIN: <strong className="text-slate-800">{activeBusiness?.gstin || "N/A"}</strong></p>
                  <p>Phone: {activeBusiness?.phone || "N/A"} | Email: {activeBusiness?.email || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#0A6CFF] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                  TAX INVOICE
                </span>
                <div className="text-[11px] text-slate-500 mt-4 space-y-1">
                  <p>Invoice No: <strong className="text-slate-950 font-mono text-xs">{invoice.invoice_number}</strong></p>
                  <p>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                  {invoice.due_date && <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>}
                  <p>Payment Mode: <strong className="text-slate-800 uppercase">{invoice.payment_method}</strong></p>
                </div>
              </div>
            </div>

            {/* Billing Addresses Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-2">BILLED TO (BUYER)</span>
                {customer ? (
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-900">{customer.name}</p>
                    <p className="text-slate-500">{customer.address || "No address recorded."}</p>
                    <p className="text-slate-500">Phone: {customer.phone || "N/A"} | Email: {customer.email || "N/A"}</p>
                    {customer.gst_number && (
                      <p className="text-slate-800 font-semibold mt-1">GSTIN: {customer.gst_number}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Cash Registry Walk-In Customer</p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">INVOICE STANDING</span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    invoice.payment_status === "paid" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : invoice.payment_status === "partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {invoice.payment_status}
                  </span>
                  
                  {invoice.payment_status !== "paid" && (
                    <div className="text-[10px] text-slate-500 mt-2">
                      <p>Dues Owed: <strong className="text-slate-950 font-bold">₹{(invoice.total_amount - invoice.amount_paid).toFixed(2)}</strong></p>
                    </div>
                  )}
                </div>

                {/* Print Dynamic QR code */}
                {activeBusiness && (
                  <div className="text-right">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(
                        `upi://pay?pa=${upiId}&pn=${activeBusiness.name}&am=${invoice.total_amount.toFixed(2)}&cu=INR&tn=${invoice.invoice_number}`
                      )}`}
                      alt="UPI Pay QR"
                      className="w-16 h-16 border border-slate-100 rounded p-0.5 ml-auto"
                    />
                    <span className="text-[8px] text-slate-400 block mt-1">Scan to Pay UPI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table with CGST/SGST Split */}
            <table className="w-full border-collapse text-left text-xs mb-8">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-2.5 pr-2">Description of Goods</th>
                  <th className="py-2.5 px-2 text-center">HSN/SKU</th>
                  <th className="py-2.5 px-2 text-right">Price</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Discount</th>
                  <th className="py-2.5 px-2 text-center">GST Rates</th>
                  <th className="py-2.5 px-2 text-right">Tax Amt</th>
                  <th className="py-2.5 pl-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => {
                    const priceNet = item.price - item.discount;
                    return (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-3 pr-2 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-2 text-center text-slate-500 font-mono">{item.product_id ? "HT-GOODS" : "HT-SERVICE"}</td>
                        <td className="py-3 px-2 text-right">₹{item.price.toFixed(2)}</td>
                        <td className="py-3 px-2 text-center font-semibold">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-slate-500">₹{(item.discount * item.quantity).toFixed(2)}</td>
                        <td className="py-3 px-2 text-center font-medium">
                          {item.tax_rate > 0 ? (
                            <span className="text-slate-600 block">{item.tax_rate}%</span>
                          ) : (
                            <span className="text-slate-400">Exempt</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-650">₹{item.tax_amount.toFixed(2)}</td>
                        <td className="py-3 pl-2 text-right font-bold text-slate-900">₹{item.total.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No billed product line items recorded on invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="flex justify-between items-start border-t border-slate-100 pt-6">
              
              {/* Bank Details & Terms */}
              <div className="max-w-md text-[10px] text-slate-500 space-y-1 pt-1">
                <span className="text-slate-800 font-bold block mb-1">TERMS & CONDITIONS:</span>
                <p>1. Goods once sold will not be accepted back or exchanged.</p>
                <p>2. Subject to Mumbai Jurisdiction authorities.</p>
                <p>3. Payments are requested within 15 days of billing date.</p>
                <div className="pt-2">
                  <span className="text-slate-800 font-bold block">BANK TRANSFER DIRECT DETAILS:</span>
                  {bankDetails.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>

              {/* Aggregated sums */}
              <div className="w-72 text-xs space-y-2 border-t-2 border-slate-800 pt-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Value</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                
                {/* CGST / SGST split rendering if taxes exist */}
                {invoice.tax_amount > 0 && (
                  <div className="space-y-1 border-b border-slate-100 pb-2">
                    <div className="flex justify-between text-[10px] text-slate-400 pl-4">
                      <span>Central GST (CGST - 50%)</span>
                      <span>₹{(invoice.tax_amount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pl-4">
                      <span>State GST (SGST - 50%)</span>
                      <span>₹{(invoice.tax_amount / 2).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>GST Total Value</span>
                  <span>₹{invoice.tax_amount.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Invoice Bill Discount</span>
                    <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-200">
                  <span className="font-bold text-slate-800">Net Invoice Amount</span>
                  <span className="text-lg font-black text-[#0A6CFF]">₹{invoice.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Amount Paid</span>
                  <span>₹{invoice.amount_paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Balance Due</span>
                  <span>₹{(invoice.total_amount - invoice.amount_paid).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Signature panel */}
          <div className="flex justify-between items-end border-t border-slate-100 pt-8 mt-12 text-[10px] text-slate-500">
            <div>
              <p>Issued by: {currentUser?.full_name || "Saaqib"} ({currentUser?.role === "admin" ? "System Administrator" : "Billing Employee"})</p>
              <p className="mt-1">Generated: {new Date(invoice.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right w-48 border-t border-slate-300 pt-4">
              <span className="font-bold text-slate-800 block">AUTHORIZED SIGNATORY</span>
              <p className="text-[8px] text-slate-400 mt-2">HADYRA TECHNOLOGIES CO.</p>
            </div>
          </div>

        </div>
      ) : (
        
        /* Monospaced 3-inch (80mm) POS Thermal Receipt Template */
        <div className="w-[80mm] bg-white text-black p-4 shadow-2xl rounded-sm border border-slate-200 font-mono text-[10px] leading-tight select-all">
          <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
            <h2 className="text-xs font-bold uppercase">{activeBusiness?.name}</h2>
            <p className="text-[8px] text-slate-500 mt-1">{activeBusiness?.address}</p>
            <p className="text-[8px] text-slate-500">GSTIN: {activeBusiness?.gstin || "N/A"}</p>
            <p className="text-[8px] text-slate-500">Phone: {activeBusiness?.phone || "N/A"}</p>
          </div>

          <div className="space-y-1 mb-3 text-[9px] border-b border-dashed border-slate-400 pb-3">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="uppercase">{invoice.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{currentUser?.full_name || "Saaqib"}</span>
            </div>
            {customer && (
              <div className="flex justify-between pt-1 font-semibold">
                <span>Client:</span>
                <span>{customer.name}</span>
              </div>
            )}
          </div>

          {/* Minimal items list */}
          <div className="border-b border-dashed border-slate-400 pb-3 mb-3">
            <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-1.5">
              <span>ITEMS / RATE</span>
              <div className="flex gap-4">
                <span>QTY</span>
                <span>TOTAL</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{item.name}</span>
                      <div className="flex gap-4">
                        <span className="w-6 text-center">{item.quantity}</span>
                        <span className="w-12 text-right">₹{item.total.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-500">
                      Rate: ₹{item.price.toFixed(0)} | Tax: {item.tax_rate}% | Disc: ₹{item.discount.toFixed(0)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 italic">No line items.</p>
              )}
            </div>
          </div>

          {/* Pricing aggregates */}
          <div className="space-y-1.5 text-[9px] border-b border-dashed border-slate-400 pb-3 mb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span>₹{invoice.tax_amount.toFixed(2)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Discount:</span>
                <span>-₹{invoice.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
              <span>NET PAY:</span>
              <span>₹{invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span>₹{invoice.amount_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[9px] pt-1">
              <span>Dues Owed:</span>
              <span>₹{(invoice.total_amount - invoice.amount_paid).toFixed(2)}</span>
            </div>
          </div>

          {/* Dynamic UPI QR Code for physical printing scanner compatibility */}
          {activeBusiness && (
            <div className="text-center space-y-1 pb-3 mb-1">
              <div className="inline-block p-1 bg-white border border-slate-200 rounded">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `upi://pay?pa=${upiId}&pn=${activeBusiness.name}&am=${invoice.total_amount.toFixed(2)}&cu=INR&tn=${invoice.invoice_number}`
                  )}`}
                  alt="UPI Receipt Scan"
                  className="w-20 h-20"
                />
              </div>
              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">UPI QR RECEIPT CODE</p>
            </div>
          )}

          <div className="text-center text-[8px] text-slate-500 space-y-0.5">
            <p className="font-bold uppercase">Thank you for your visit!</p>
            <p>For support, email support@hadyratech.com</p>
            <p>Invoice generated by Hadyra SaaS</p>
          </div>
        </div>

      )}

    </div>
  );
}
