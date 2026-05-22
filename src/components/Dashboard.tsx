"use client";

import React, { useState, useMemo } from "react";
import { useDb } from "@/context/DbContext";
import { 
  TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, 
  CheckCircle2, Send, Sparkles, Terminal, Cloud, ShieldAlert, 
  Briefcase, Activity, Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { invoices, products, expenses, logs, activeBusiness } = useDb();
  
  // AI assistant states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am Hadyra AI. Ask me anything about your Monthly Recurring Revenue (MRR), cloud overhead, SLA compliance, or total contract values." }
  ]);

  // Currency helper
  const currencySymbol = useMemo(() => {
    return activeBusiness?.currency === "QAR" ? "QR" : "₹";
  }, [activeBusiness]);

  const formatCurrency = (amount: number) => {
    if (activeBusiness?.currency === "QAR") {
      return `QR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrencyCompact = (amount: number) => {
    if (activeBusiness?.currency === "QAR") {
      return `QR ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  // Filter lists based on the active business
  const businessInvoices = useMemo(() => {
    return invoices.filter(inv => inv.business_id === activeBusiness?.id);
  }, [invoices, activeBusiness]);

  const businessProducts = useMemo(() => {
    return products.filter(prod => prod.business_id === activeBusiness?.id);
  }, [products, activeBusiness]);

  const businessExpenses = useMemo(() => {
    return expenses.filter(exp => exp.business_id === activeBusiness?.id);
  }, [expenses, activeBusiness]);

  const businessLogs = useMemo(() => {
    return logs.filter(log => log.business_id === activeBusiness?.id).slice(0, 5);
  }, [logs, activeBusiness]);

  // SaaS Calculations
  const stats = useMemo(() => {
    let totalContractValue = 0; // Total of all invoice amounts
    let paidRevenue = 0;
    let unpaidDues = 0;
    let mrr = 0;

    businessInvoices.forEach(inv => {
      totalContractValue += inv.total_amount;
      paidRevenue += inv.amount_paid;
      unpaidDues += (inv.total_amount - inv.amount_paid);

      // Calculate MRR contribution from invoice items
      if (inv.items) {
        inv.items.forEach(item => {
          const match = businessProducts.find(p => p.id === item.product_id);
          const cycle = match?.billing_cycle || "one-time";
          
          if (cycle === "monthly") {
            mrr += item.price * item.quantity;
          } else if (cycle === "annual") {
            mrr += (item.price * item.quantity) / 12;
          }
        });
      }
    });

    // Cloud overhead calculations: filter expenses matching hosting, IT, cloud, servers, vercel, AWS, GCP
    const cloudKeywords = ["cloud", "hosting", "aws", "gcp", "server", "domain", "internet", "it", "software", "license", "vercel", "saas"];
    const cloudExpensesTotal = businessExpenses
      .filter(exp => {
        const cat = exp.category.toLowerCase();
        const desc = (exp.description || "").toLowerCase();
        return cloudKeywords.some(keyword => cat.includes(keyword) || desc.includes(keyword));
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = businessExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalContractValue - totalExpenses;
    
    // Average Contract Value (ACV)
    const acv = businessInvoices.length > 0 ? totalContractValue / businessInvoices.length : 0;

    // SLA risk count (Services Registry - low stock quantity maps to low SLA / resource slots threshold)
    const lowSlaServices = businessProducts.filter(p => p.stock_quantity <= p.min_stock_alert);

    return {
      mrr,
      totalContractValue,
      paidRevenue,
      unpaidDues,
      cloudExpensesTotal,
      totalExpenses,
      netProfit,
      acv,
      lowSlaCount: lowSlaServices.length,
      lowSlaServices
    };
  }, [businessInvoices, businessProducts, businessExpenses]);

  // Generate SVG Points for 7-day Revenue line chart
  const chartPoints = useMemo(() => {
    const dailyTotals: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dailyTotals[dateStr] = 0;
    }

    businessInvoices.forEach(inv => {
      if (inv.invoice_date in dailyTotals) {
        dailyTotals[inv.invoice_date] += inv.total_amount;
      }
    });

    const values = Object.values(dailyTotals);
    const keys = Object.keys(dailyTotals).map(k => {
      const [,,day] = k.split("-");
      return day;
    });

    const maxVal = Math.max(...values, 1000);
    const height = 150;
    const width = 500;
    
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - (val / maxVal) * (height - 20) - 10;
      return { x, y, value: val, day: keys[idx] };
    });

    const pathString = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaString = `${pathString} L ${width} ${height} L 0 ${height} Z`;

    return { points, pathString, areaString, maxVal };
  }, [businessInvoices]);

  // Heuristic-based AI query parser updated for SaaS
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let aiResponse = "";
      const textLower = userText.toLowerCase();

      if (textLower.includes("mrr") || textLower.includes("recurring") || textLower.includes("monthly revenue")) {
        aiResponse = `Your Monthly Recurring Revenue (MRR) is ${formatCurrency(stats.mrr)}. This is calculated as the sum of monthly service subscriptions plus the monthly-equivalent value (Total/12) of active annual licenses.`;
      } 
      else if (textLower.includes("cloud") || textLower.includes("hosting") || textLower.includes("overhead") || textLower.includes("infra")) {
        aiResponse = `Hadyra's cloud infrastructure & server overhead is currently ${formatCurrency(stats.cloudExpensesTotal)}. This tracks expenses tagged under cloud services, hosting, broadband, and software subscriptions.`;
      } 
      else if (textLower.includes("contract") || textLower.includes("ltv") || textLower.includes("valuation") || textLower.includes("tcv")) {
        aiResponse = `The Total Contract Value (TCV) across all software agreements is ${formatCurrency(stats.totalContractValue)}. Your Average Contract Value (ACV) stands at ${formatCurrency(stats.acv)} across ${businessInvoices.length} invoices/agreements.`;
      } 
      else if (textLower.includes("sla") || textLower.includes("risk") || textLower.includes("capacity") || textLower.includes("consultant")) {
        if (stats.lowSlaCount > 0) {
          aiResponse = `You have ${stats.lowSlaCount} service(s) at SLA risk or with low capacity: ` + 
            stats.lowSlaServices.map(i => `${i.name} (${i.stock_quantity} slots/hours remaining, alert threshold: ${i.min_stock_alert})`).join(", ") + ". Consider allocating more resource capacity or consultants to these lines.";
        } else {
          aiResponse = "Excellent! All service capacities are healthy. Consultant allocations and support SLAs are currently operating within safe thresholds.";
        }
      } 
      else if (textLower.includes("dues") || textLower.includes("unpaid") || textLower.includes("outstanding")) {
        const debtors = businessInvoices.filter(inv => inv.payment_status !== "paid");
        if (debtors.length > 0) {
          aiResponse = `You have ${formatCurrency(stats.unpaidDues)} in outstanding invoice dues across ${debtors.length} contract(s). Outstanding invoices: ` + 
            debtors.map(d => `${d.invoice_number} (${formatCurrency(d.total_amount - d.amount_paid)} remaining)`).join(", ") + ".";
        } else {
          aiResponse = "Outstanding! All billing contracts are fully settled. You have zero outstanding accounts receivable.";
        }
      } 
      else if (textLower.includes("profit") || textLower.includes("net") || textLower.includes("margin")) {
        aiResponse = `Your estimated Net Profit is ${formatCurrency(stats.netProfit)}. This represents TCV (${formatCurrency(stats.totalContractValue)}) minus total business expenses (${formatCurrency(stats.totalExpenses)}).`;
      }
      else if (textLower.includes("summary") || textLower.includes("status") || textLower.includes("how are we doing")) {
        aiResponse = `Here is your SaaS performance summary for "${activeBusiness?.name}":\n` +
          `• MRR: ${formatCurrency(stats.mrr)}\n` +
          `• Total Contract Valuation (TCV): ${formatCurrency(stats.totalContractValue)}\n` +
          `• Cloud/Hosting Overhead: ${formatCurrency(stats.cloudExpensesTotal)}\n` +
          `• SLA Risk Status: ${stats.lowSlaCount > 0 ? `${stats.lowSlaCount} alerts active` : "Healthy"}\n` +
          `• Net Profit: ${formatCurrency(stats.netProfit)}`;
      } 
      else {
        aiResponse = "I can analyze your software business metrics. Try asking me:\n" +
          "• 'What is our MRR?'\n" +
          "• 'Show cloud hosting overhead'\n" +
          "• 'What is our total contract value (TCV)?'\n" +
          "• 'Are there any SLA capacity risks?'\n" +
          "• 'Summarize our financial status'";
      }

      setChatHistory(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 550);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            SaaS & Service Dashboard
          </h1>
          <p className="text-xs md:text-sm text-brand-gray">
            Real-time subscription metrics and service analytics for <strong className="text-slate-300">{activeBusiness?.name}</strong>.
          </p>
        </div>
        <button
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-blue/20"
        >
          <Sparkles className="w-4 h-4 animate-pulse-subtle" />
          AI Copilot
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR Card */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] text-brand-gray font-bold tracking-wider uppercase">Monthly Recurring Revenue</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold font-display text-white">{formatCurrencyCompact(stats.mrr)}</span>
          </div>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Active monthly & annual licenses</span>
          </p>
        </motion.div>

        {/* Contract Valuation / TCV */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 p-2 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue rounded-xl">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] text-brand-gray font-bold tracking-wider uppercase">Total Contract Value (TCV)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {formatCurrencyCompact(stats.totalContractValue)}
            </span>
          </div>
          <p className="text-[10px] text-brand-blue flex items-center gap-1 mt-2">
            <span>Avg contract: {formatCurrencyCompact(stats.acv)}</span>
          </p>
        </motion.div>

        {/* Cloud Infrastructure Overhead */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-panel rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <Cloud className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] text-brand-gray font-bold tracking-wider uppercase">Cloud & Server Overhead</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold font-display text-white">{formatCurrencyCompact(stats.cloudExpensesTotal)}</span>
          </div>
          <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-2">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Hosting, SaaS sub & broadband</span>
          </p>
        </motion.div>

        {/* SLA Compliance / Active Agreements */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] text-brand-gray font-bold tracking-wider uppercase">Resource SLA Compliance</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {stats.lowSlaCount > 0 ? `${stats.lowSlaCount} Alert` : "Healthy"}
            </span>
          </div>
          <p className={`text-[10px] flex items-center gap-1 mt-2 ${stats.lowSlaCount > 0 ? "text-amber-400" : "text-brand-gray"}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats.lowSlaCount} services below capacity thresholds</span>
          </p>
        </motion.div>

      </div>

      {/* Graphs and Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Revenue Graph Panel */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Service Revenue Trend</h3>
              <p className="text-[10px] text-brand-gray">Gross sales performance over the past 7 days</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 block">+{formatCurrencyCompact(chartPoints.points.reduce((acc, curr) => acc + curr.value, 0) / 7)} / day</span>
              <span className="text-[9px] text-brand-gray">Average Daily Run-rate</span>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="flex-1 min-h-[160px] flex items-end">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A6CFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0A6CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area background */}
              <path d={chartPoints.areaString} fill="url(#gradient-area)" />

              {/* Line path */}
              <path d={chartPoints.pathString} fill="none" stroke="#0A6CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points */}
              {chartPoints.points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#030712" stroke="#0A6CFF" strokeWidth="2" className="cursor-pointer" />
                  <text x={p.x} y={p.y - 12} fontSize="8" fill="#ffffff" fontWeight="semibold" textAnchor="middle" opacity="0.8">
                    {p.value > 0 ? formatCurrencyCompact(p.value) : ""}
                  </text>
                  <text x={p.x} y="148" fontSize="8" fill="#9EA7B3" textAnchor="middle">
                    {p.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Alerts & Dues Panel */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display mb-1">Financial Reminders</h3>
            <p className="text-[10px] text-brand-gray mb-4">Urgent outstanding actions required</p>

            <div className="space-y-3.5">
              {/* Due Balance Alert */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-brand-gray block uppercase font-bold">Unsettled Accounts</span>
                  <span className="text-xs font-semibold text-slate-200 block">{formatCurrency(stats.unpaidDues)} pending</span>
                </div>
              </div>

              {/* SLA Warning Alert */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-brand-gray block uppercase font-bold">SLA/Capacity Alerts</span>
                  <span className="text-xs font-semibold text-slate-200 block">{stats.lowSlaCount} service lines under capacity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900/60 pt-4 mt-4">
            <span className="text-[9px] text-brand-gray font-bold block mb-2 uppercase">SLA & CAPACITY WARNINGS</span>
            <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1">
              {stats.lowSlaServices.length > 0 ? (
                stats.lowSlaServices.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 truncate max-w-[120px]">{p.name}</span>
                    <span className="font-bold text-amber-400">{p.stock_quantity} left</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All service lines & SLAs healthy!</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Activity Logs Feed */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4.5 h-4.5 text-brand-blue" />
          <h3 className="text-sm font-bold text-white font-display">Workspace Activity Ledger</h3>
        </div>
        <div className="space-y-3 font-mono text-[11px]">
          {businessLogs.length > 0 ? (
            businessLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-900 last:border-b-0">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#0A6CFF] font-semibold">[{log.action}]</span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-0 text-brand-gray text-[10px]">
                  <span>by {log.user_name}</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-brand-gray text-xs text-center py-4">No logged records found for this workspace.</p>
          )}
        </div>
      </div>

      {/* AI Sales Copilot Drawer Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45" onClick={() => setChatOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#050a18] border-l border-slate-900 z-50 flex flex-col justify-between shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-blue/15 text-brand-blue border border-brand-blue/20">
                    <Sparkles className="w-4 h-4 animate-pulse-subtle" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-display">Hadyra AI Copilot</h4>
                    <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Live Business Analyst
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-900 text-brand-gray hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Chat History Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`
                      max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line
                      ${msg.sender === "user" 
                        ? "bg-brand-blue text-white rounded-tr-none shadow-md shadow-brand-blue/10" 
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                      }
                    `}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-900 bg-slate-950/40 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about MRR, cloud overhead, SLA compliance, TCV..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl glass-input"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-brand-blue hover:bg-blue-600 text-white rounded-xl transition flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

