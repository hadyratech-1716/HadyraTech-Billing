"use client";

import React, { useState } from "react";
import { useDb } from "@/context/DbContext";
import { 
  LayoutDashboard, ShoppingCart, FileText, Package, Users, 
  Receipt, BarChart3, Settings, LogOut, Menu, X, ChevronDown, 
  User, Cloud, CloudLightning, RefreshCw, AlertCircle, Building2, Plus, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Layout({ children, activeView, setActiveView }: LayoutProps) {
  const { 
    currentUser, logout, activeBusiness, businesses, changeBusiness, addBusiness, syncStatus, syncToCloud, firebaseConfig 
  } = useDb();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [showAddBizModal, setShowAddBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState("");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "employee"] },
    { id: "billing", label: "POS Billing", icon: ShoppingCart, roles: ["admin", "employee"] },
    { id: "invoices", label: "Invoices Ledger", icon: FileText, roles: ["admin", "employee"] },
    { id: "inventory", label: "Inventory Stock", icon: Package, roles: ["admin", "employee"] },
    { id: "customers", label: "Client Database", icon: Users, roles: ["admin", "employee"] },
    { id: "expenses", label: "Expenses Track", icon: Receipt, roles: ["admin"] },
    { id: "reports", label: "Reports & GST", icon: BarChart3, roles: ["admin"] },
    { id: "admin-users", label: "User Access", icon: Shield, roles: ["admin"] },
    { id: "settings", label: "Control Panel", icon: Settings, roles: ["admin"] },
  ];

  const handleCreateBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBizName.trim()) {
      addBusiness(newBizName);
      setNewBizName("");
      setShowAddBizModal(false);
      setBizDropdownOpen(false);
    }
  };

  const syncIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-brand-blue animate-spin" />;
      case "synced":
        return <Cloud className="w-4 h-4 text-emerald-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <CloudLightning className="w-4 h-4 text-slate-500" />;
    }
  };

  const syncLabel = () => {
    switch (syncStatus) {
      case "syncing": return "Syncing...";
      case "synced": return "Cloud Synced";
      case "error": return "Sync Error";
      default: return "Offline Cache";
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-page text-slate-100 overflow-hidden">
      
      {/* Mobile Top Navbar */}
      <header className="md:hidden w-full h-16 fixed top-0 left-0 bg-[#071B3B]/90 border-b border-slate-900 flex items-center justify-between px-4 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-brand-blue" />
          <span className="font-extrabold tracking-tight font-display text-lg text-white">HADYRA BILLING</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncToCloud} 
            disabled={!firebaseConfig}
            className={`p-1.5 rounded-lg border border-slate-800 ${firebaseConfig ? "hover:bg-slate-950/60" : "opacity-40"}`}
            title="Sync Data"
          >
            {syncIcon()}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#050a18]/95 border-r border-slate-900 z-50 transform md:translate-x-0 transition-transform duration-300 ease-in-out md:static
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Header Brand */}
          <div className="h-16 px-6 border-b border-slate-900 flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-brand-navy border border-brand-blue/30 text-brand-blue shadow-[0_0_15px_rgba(10,108,255,0.15)]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-white font-display text-md">HADYRA BILLING</h2>
              <span className="text-[10px] text-brand-gray tracking-wider uppercase font-semibold">Enterprise OS</span>
            </div>
          </div>

          {/* Business Switcher Dropdown */}
          <div className="px-4 py-3 relative border-b border-slate-950">
            <button
              onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0B1329]/60 border border-slate-850 hover:border-slate-800 text-left transition"
            >
              <div className="truncate pr-2">
                <span className="text-[9px] text-brand-gray block uppercase font-bold tracking-wide">ACTIVE STORE</span>
                <span className="text-xs font-semibold text-slate-200 block truncate">{activeBusiness?.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-brand-gray flex-shrink-0" />
            </button>

            <AnimatePresence>
              {bizDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBizDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-4 right-4 mt-1 bg-slate-950 border border-slate-900 rounded-xl p-1.5 shadow-2xl z-20"
                  >
                    <span className="text-[9px] text-brand-gray font-bold tracking-wider px-2.5 py-1.5 block border-b border-slate-900">
                      SWITCH BRANCH
                    </span>
                    <div className="max-h-40 overflow-y-auto py-1">
                      {businesses.map((biz) => (
                        <button
                          key={biz.id}
                          onClick={() => {
                            changeBusiness(biz.id);
                            setBizDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                            activeBusiness?.id === biz.id 
                              ? "bg-brand-navy/60 text-brand-blue font-semibold border-l-2 border-brand-blue" 
                              : "text-slate-300 hover:bg-slate-900/60"
                          }`}
                        >
                          <span className="truncate">{biz.name}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddBizModal(true)}
                      className="w-full mt-1.5 border-t border-slate-900 pt-1.5 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs text-brand-blue hover:text-blue-400 font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Business
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasAccess = currentUser && item.roles.includes(currentUser.role);
              const isActive = activeView === item.id;
              
              if (!hasAccess) {
                // Return lock indicator/restricted UI
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 text-xs text-brand-gray/40 rounded-xl cursor-not-allowed bg-slate-950/10 border border-transparent select-none"
                    title="Requires Admin Privileges"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[8px] bg-slate-950 text-brand-gray/50 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-900">
                      Admin
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-xs rounded-xl font-medium transition-all ${
                    isActive 
                      ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/15 font-semibold" 
                      : "text-brand-gray hover:text-slate-200 hover:bg-slate-950/50"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section & Database Sync indicator */}
          <div className="p-4 border-t border-slate-950 bg-slate-950/20 space-y-3">
            {/* Database Sync shortcut button */}
            <button
              onClick={syncToCloud}
              disabled={!firebaseConfig}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                firebaseConfig 
                  ? "bg-slate-950/80 border-slate-850 hover:bg-slate-950 hover:border-slate-800" 
                  : "bg-slate-950/20 border-slate-900 opacity-60 cursor-not-allowed"
              }`}
              title={firebaseConfig ? "Sync to Firebase Firestore" : "Connect database in Control Panel to sync"}
            >
              <div className="flex items-center gap-2">
                {syncIcon()}
                <span className="text-[10px] font-bold text-slate-300 tracking-wide uppercase">{syncLabel()}</span>
              </div>
              {firebaseConfig && <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />}
            </button>

            {/* Profile control */}
            <div className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900">
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-300 border border-slate-800 flex-shrink-0">
                  <User className="w-4 h-4 text-brand-blue" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-200 block truncate">{currentUser?.full_name}</span>
                  <span className="text-[9px] text-brand-blue font-bold tracking-wider uppercase">{currentUser?.role}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 rounded-lg text-brand-gray hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main View Container */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16 h-screen overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-12">
          {children}
        </div>
      </main>

      {/* Create Business Modal */}
      <AnimatePresence>
        {showAddBizModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">Create Store Branch</h3>
              <p className="text-xs text-brand-gray mb-4">Set up a separate billing and inventory workspace.</p>

              <form onSubmit={handleCreateBusinessSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Shop / Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hadyra Cafe & Bistro"
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl glass-input"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBizModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-brand-gray text-xs font-semibold rounded-xl hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(10,108,255,0.3)]"
                  >
                    Create Branch
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
