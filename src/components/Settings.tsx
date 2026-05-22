"use client";

import React, { useState, useEffect } from "react";
import { useDb } from "@/context/DbContext";
import { 
  Settings as SettingsIcon, Building, ShieldAlert, Cloud, 
  CloudOff, RefreshCw, Upload, Download, Check, AlertTriangle, Key, Link2 
} from "lucide-react";

export default function Settings() {
  const { 
    activeBusiness, updateBusiness, supabaseConfig, saveSupabaseConfig, 
    disconnectSupabase, syncStatus, exportBackup, importBackup, resetToMock 
  } = useDb();

  // Profile forms
  const [bizName, setBizName] = useState("");
  const [bizGstin, setBizGstin] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizPrefix, setBizPrefix] = useState("");
  const [upiId, setUpiId] = useState("6048894526@KKBK0008488.ifsc.npci");
  const [bankDetails, setBankDetails] = useState("");

  // Supabase forms
  const [sbUrl, setSbUrl] = useState("");
  const [sbKey, setSbKey] = useState("");
  const [sbVerifying, setSbVerifying] = useState(false);
  const [sbMessage, setSbMessage] = useState("");

  useEffect(() => {
    if (activeBusiness) {
      setBizName(activeBusiness.name);
      setBizGstin(activeBusiness.gstin || "");
      setBizPhone(activeBusiness.phone || "");
      setBizEmail(activeBusiness.email || "");
      setBizAddress(activeBusiness.address || "");
      setBizPrefix(activeBusiness.invoice_prefix || "INV");
    }

    if (supabaseConfig) {
      setSbUrl(supabaseConfig.url);
      setSbKey(supabaseConfig.anonKey);
    }

    const storedUpi = localStorage.getItem("hadyra_merchant_upi");
    setUpiId(storedUpi || "6048894526@KKBK0008488.ifsc.npci");

    const storedBank = localStorage.getItem("hadyra_bank_details");
    setBankDetails(storedBank || `👋 Hello! Here are my account details:
1️⃣ A/c no.: 6048894526
2️⃣ IFSC Code: KKBK0008488
3️⃣ Home branch: ANNA NAGAR, CHENNAI`);
  }, [activeBusiness, supabaseConfig]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    updateBusiness(activeBusiness.id, {
      name: bizName,
      gstin: bizGstin,
      phone: bizPhone,
      email: bizEmail,
      address: bizAddress,
      invoice_prefix: bizPrefix
    });

    // Save local UPI details to localStorage for POS reference
    localStorage.setItem("hadyra_merchant_upi", upiId);
    localStorage.setItem("hadyra_bank_details", bankDetails);
    alert("Business configurations updated successfully!");
  };

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl || !sbKey) return;

    setSbVerifying(true);
    setSbMessage("Authenticating cloud endpoints...");
    
    const success = await saveSupabaseConfig(sbUrl, sbKey);
    setSbVerifying(false);
    
    if (success) {
      setSbMessage("Connected successfully! Database tables auto-synced.");
    } else {
      setSbMessage("Verification failed. Please review your credentials.");
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = importBackup(result);
      if (success) {
        alert("System data restored successfully from JSON backup!");
      } else {
        alert("Import failed. Invalid JSON structure format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">System Control Panel</h1>
          <p className="text-xs md:text-sm text-brand-gray">Configure merchant settings, logo formats, and cloud databases syncing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Business Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-950 pb-3">
              <Building className="w-4.5 h-4.5 text-brand-blue" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Branch Store Configuration</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Store / Company Name</label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Company GSTIN Code</label>
                  <input
                    type="text"
                    value={bizGstin}
                    onChange={(e) => setBizGstin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Billing Email Address</label>
                  <input
                    type="email"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Invoice Serial Prefix</label>
                  <input
                    type="text"
                    required
                    value={bizPrefix}
                    onChange={(e) => setBizPrefix(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Merchant UPI Address (for Billing QR)</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input font-mono text-xs text-brand-blue"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Store Address</label>
                <textarea
                  rows={3}
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Bank Account Details (Printed on Invoices)</label>
                <textarea
                  rows={4}
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input focus:outline-none font-mono text-xs text-slate-300"
                  placeholder="Enter bank details..."
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-blue hover:bg-blue-650 text-white font-bold rounded-xl transition shadow-lg shadow-brand-blue/15"
              >
                Save Configurations
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Database Cloud and Backups */}
        <div className="space-y-6">
          
          {/* Supabase connection */}
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-950 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4.5 h-4.5 text-[#0A6CFF]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supabase Cloud database</h3>
              </div>
              {supabaseConfig ? (
                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  Connected
                </span>
              ) : (
                <span className="text-[8px] bg-slate-900 text-brand-gray px-1.5 py-0.5 rounded font-bold uppercase border border-slate-800">
                  Local-first
                </span>
              )}
            </div>

            {supabaseConfig ? (
              <div className="space-y-3.5 text-xs text-brand-gray">
                <p>Application is synchronized with cloud database PostgreSQL. Offline changes sync automatically in the background.</p>
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5 font-mono text-[10px]">
                  <p className="truncate">URL: <span className="text-slate-350">{supabaseConfig.url}</span></p>
                  <p className="truncate">Key: <span className="text-slate-350">{supabaseConfig.anonKey.substring(0, 15)}...</span></p>
                </div>
                <button
                  onClick={disconnectSupabase}
                  className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 font-bold rounded-xl transition"
                >
                  Disconnect database Cloud
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloudSubmit} className="space-y-3.5 text-xs">
                <p className="text-brand-gray leading-normal">Enter your Supabase URL & Anon Key to connect. Your local offline database will automatically synchronize.</p>
                
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Project URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://xxxx.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono text-[10px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold flex items-center gap-1"><Key className="w-3.5 h-3.5" /> Anon Public API Key</label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOi..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono text-[10px]"
                  />
                </div>

                {sbMessage && (
                  <p className="text-[10px] text-brand-blue font-mono">{sbMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={sbVerifying}
                  className="w-full py-2.5 bg-brand-blue hover:bg-blue-650 text-white font-bold rounded-xl transition"
                >
                  {sbVerifying ? "Verifying connection..." : "Connect database Cloud"}
                </button>
              </form>
            )}
          </div>

          {/* Backup Panel */}
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-950 pb-3">
              <ShieldAlert className="w-4.5 h-4.5 text-brand-blue" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Backups & Recovery</h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              {/* Export backup */}
              <button
                onClick={exportBackup}
                className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-slate-800 transition"
              >
                <Download className="w-5 h-5 text-brand-blue" />
                <span className="font-bold text-slate-350 text-center">Export Backup</span>
              </button>

              {/* Import backup */}
              <label className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-slate-800 transition cursor-pointer">
                <Upload className="w-5 h-5 text-brand-blue" />
                <span className="font-bold text-slate-350 text-center">Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Factory Reset */}
            <div className="border-t border-slate-950 pt-4">
              <span className="text-[9px] text-brand-gray font-bold block uppercase mb-1">Factory Reset Options</span>
              <button
                onClick={() => {
                  if (confirm("Reset current database registry cache? This wipes all transaction records and returns database to initial demonstration values.")) {
                    resetToMock();
                  }
                }}
                className="w-full py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500/20 font-bold rounded-xl transition text-xs"
              >
                Reset Database to Mock
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
