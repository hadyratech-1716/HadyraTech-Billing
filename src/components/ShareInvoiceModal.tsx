"use client";

import React, { useState, useMemo } from "react";
import { useDb } from "@/context/DbContext";
import { Send, Phone, Mail, Check, X, FileText, Share, AlertTriangle, Copy } from "lucide-react";
import { motion } from "framer-motion";

interface ShareInvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

export default function ShareInvoiceModal({ invoiceId, onClose }: ShareInvoiceModalProps) {
  const { invoices, customers, activeBusiness, currentUser } = useDb();
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailTemplate, setEmailTemplate] = useState<"standard" | "reminder" | "delivery">("standard");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [upiId, setUpiId] = useState("6048894526@KKBK0008488.ifsc.npci");

  // Find invoice details
  const invoice = useMemo(() => {
    return invoices.find((inv) => inv.id === invoiceId);
  }, [invoices, invoiceId]);

  const customer = useMemo(() => {
    if (!invoice || !invoice.customer_id) return null;
    return customers.find((c) => c.id === invoice.customer_id);
  }, [customers, invoice]);

  // Set default values from client profile and fetch custom UPI
  React.useEffect(() => {
    if (customer) {
      setPhoneInput(customer.phone || "");
      setEmailInput(customer.email || "");
    }
    const storedUpi = localStorage.getItem("hadyra_merchant_upi");
    if (storedUpi) setUpiId(storedUpi);
  }, [customer]);

  // WhatsApp Message Generator
  const waLink = useMemo(() => {
    if (!invoice || !activeBusiness) return "#";
    
    const clientName = customer ? customer.name : "Valued Customer";
    const dueAmt = invoice.total_amount - invoice.amount_paid;
    
    let text = `Dear ${clientName},\n\nHope you are doing well. Please find summary of tax invoice *${invoice.invoice_number}* issued by *${activeBusiness.name}*:\n\n• Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}\n• Total Amount: ₹${invoice.total_amount.toFixed(2)}\n• Amount Paid: ₹${invoice.amount_paid.toFixed(2)}\n• Status: *${invoice.payment_status.toUpperCase()}*\n`;

    if (dueAmt > 0) {
      text += `• Due Balance: ₹${dueAmt.toFixed(2)}\n• UPI QR Code: upi://pay?pa=${upiId}&pn=${encodeURIComponent(activeBusiness.name)}&am=${invoice.total_amount.toFixed(2)}&cu=INR&tn=${invoice.invoice_number}\n`;
    }

    text += `\nThank you for choosing Hadyra Services!`;
    
    // Clean phone number (remove spaces, plus sign)
    const cleanedPhone = phoneInput.replace(/[^0-9]/g, "");
    
    let phoneWithCountry = cleanedPhone;
    if (cleanedPhone) {
      const activeAddress = activeBusiness?.address?.toLowerCase() || "";
      const isQatar = activeAddress.includes("qatar") || activeAddress.includes("doha");
      
      if (isQatar && cleanedPhone.length === 8) {
        phoneWithCountry = `974${cleanedPhone}`;
      } else if (!isQatar && cleanedPhone.length === 10) {
        phoneWithCountry = `91${cleanedPhone}`;
      }
    }
    
    return `https://wa.me/${phoneWithCountry || "919876543210"}?text=${encodeURIComponent(text)}`;
  }, [invoice, customer, activeBusiness, phoneInput, upiId]);

  // Email Template Generator
  const emailTemplates = useMemo(() => {
    if (!invoice || !activeBusiness) return { subject: "", body: "" };

    const clientName = customer ? customer.name : "Customer";
    const invoiceNum = invoice.invoice_number;
    const bizName = activeBusiness.name;

    switch (emailTemplate) {
      case "reminder":
        return {
          subject: `URGENT PAYMENT REMINDER: Overdue Invoice ${invoiceNum} - ${bizName}`,
          body: `Dear ${clientName},\n\nThis is a friendly reminder that invoice ${invoiceNum} totaling ₹${invoice.total_amount.toFixed(2)} is currently unpaid.\n\nOutstanding Dues: ₹${(invoice.total_amount - invoice.amount_paid).toFixed(2)}\nInvoice Date: ${invoice.invoice_date}\n\nPlease clear the balance using UPI or wire transfer details.\n\nBest regards,\n${bizName}`
        };
      case "delivery":
        return {
          subject: `DISPATCH & DELIVERY NOTICE: Invoice ${invoiceNum} - ${bizName}`,
          body: `Dear ${clientName},\n\nWe are pleased to inform you that the inventory items on invoice ${invoiceNum} have been packed and handed over to logistics.\n\nSummary:\nInvoice Number: ${invoiceNum}\nTotal Valuation: ₹${invoice.total_amount.toFixed(2)}\nPayment Status: ${invoice.payment_status.toUpperCase()}\n\nTrack your packages directly with our logistics team.\n\nBest regards,\n${bizName}`
        };
      default: // standard invoice delivery
        return {
          subject: `TAX INVOICE ATTACHED: Invoice ${invoiceNum} - ${bizName}`,
          body: `Dear ${clientName},\n\nPlease find attached tax invoice ${invoiceNum} issued on ${invoice.invoice_date}.\n\nInvoice Total: ₹${invoice.total_amount.toFixed(2)}\nAmount Paid: ₹${invoice.amount_paid.toFixed(2)}\nPayment Status: ${invoice.payment_status.toUpperCase()}\n\nThank you for doing business with Hadyra!\n\nBest regards,\n${bizName}`
        };
    }
  }, [invoice, customer, activeBusiness, emailTemplate]);

  const emailMailto = useMemo(() => {
    return `mailto:${emailInput || "billing@hadyratech.com"}?subject=${encodeURIComponent(emailTemplates.subject)}&body=${encodeURIComponent(emailTemplates.body)}`;
  }, [emailInput, emailTemplates]);

  if (!invoice) return null;

  const handleCopyWhatsApp = () => {
    if (!activeBusiness) return;
    const clientName = customer ? customer.name : "Valued Customer";
    const dueAmt = invoice.total_amount - invoice.amount_paid;
    
    let text = `Dear ${clientName},\n\nHope you are doing well. Please find summary of tax invoice *${invoice.invoice_number}* issued by *${activeBusiness.name}*:\n\n• Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}\n• Total Amount: ₹${invoice.total_amount.toFixed(2)}\n• Amount Paid: ₹${invoice.amount_paid.toFixed(2)}\n• Status: *${invoice.payment_status.toUpperCase()}*\n`;

    if (dueAmt > 0) {
      text += `• Due Balance: ₹${dueAmt.toFixed(2)}\n• UPI QR Code: upi://pay?pa=${upiId}&pn=${encodeURIComponent(activeBusiness.name)}&am=${invoice.total_amount.toFixed(2)}&cu=INR&tn=${invoice.invoice_number}\n`;
    }

    text += `\nThank you for choosing Hadyra Services!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    });
  };

  const handleCopyEmail = () => {
    const text = `Subject: ${emailTemplates.subject}\n\n${emailTemplates.body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-brand-blue/15 text-brand-blue border border-brand-blue/20">
              <Share className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Share Invoice Document</h3>
              <p className="text-[10px] text-brand-gray font-mono">Invoice Number: {invoice.invoice_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-900 text-brand-gray hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Brief */}
        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex justify-between items-center text-xs">
          <div>
            <span className="text-[9px] text-brand-gray font-bold block uppercase">BILL TOTAL</span>
            <span className="text-sm font-bold text-slate-200">₹{invoice.total_amount.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-brand-gray font-bold block uppercase">STATUS</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              invoice.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {invoice.payment_status}
            </span>
          </div>
        </div>

        {/* WhatsApp billing module */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-350 font-bold uppercase tracking-wider text-[10px]">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Send on WhatsApp Web</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Country code + Number (e.g. 919876543210)"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input bg-slate-950/50 border border-slate-850 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue"
            />
            <div className="flex gap-1.5">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-xl transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-brand-gray hover:text-white rounded-xl transition flex items-center justify-center"
                title="Copy WhatsApp message text"
              >
                {copiedWhatsApp ? (
                  <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Email Invoice module */}
        <div className="space-y-3 text-xs border-t border-slate-900 pt-4">
          <div className="flex items-center gap-1.5 text-slate-350 font-bold uppercase tracking-wider text-[10px]">
            <Mail className="w-4 h-4 text-[#0A6CFF]" />
            <span>Notify Client via Email</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "standard", label: "Invoice Receipt" },
              { id: "reminder", label: "Due Balance Reminder" },
              { id: "delivery", label: "Delivery Dispatch" }
            ].map(tpl => (
              <button
                key={tpl.id}
                onClick={() => setEmailTemplate(tpl.id as any)}
                className={`p-2 border rounded-xl text-center font-medium transition-all ${
                  emailTemplate === tpl.id 
                    ? "bg-[#0A6CFF]/15 border-brand-blue text-[#0A6CFF]" 
                    : "bg-slate-950/40 border-slate-850 text-brand-gray hover:text-slate-200"
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="customer@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input bg-slate-950/50 border border-slate-850 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue"
            />
            <div className="flex gap-1.5">
              <a
                href={emailMailto}
                className="px-4 py-2.5 bg-brand-blue hover:bg-blue-650 active:scale-[0.98] text-white font-bold rounded-xl transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Email
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-brand-gray hover:text-white rounded-xl transition flex items-center justify-center"
                title="Copy Email subject and body text"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info label */}
        <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex gap-2.5 text-[10px] text-brand-gray leading-normal">
          <AlertTriangle className="w-4.5 h-4.5 text-[#0A6CFF] flex-shrink-0" />
          <p>Clicking sharing triggers redirects to WhatsApp Web or launches your system's default email agent. If you don't have a default email client configured, use the Copy buttons next to the send triggers to copy the text to clipboard directly.</p>
        </div>

      </motion.div>
    </div>
  );
}
