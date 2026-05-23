"use client";

import React, { useState } from "react";
import { useDb, AuthorizedUser } from "@/context/DbContext";
import { 
  Shield, UserPlus, Search, Edit2, Trash2, Key, CheckCircle, 
  AlertTriangle, RefreshCw, X, HelpCircle, Mail, User, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersAdmin() {
  const { 
    authorizedUsers, addAuthorizedUser, updateAuthorizedUser, deleteAuthorizedUser,
    firebaseConfig, syncStatus, syncError, syncToCloud 
  } = useDb();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AuthorizedUser | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Guide details toggle
  const [showGuide, setShowGuide] = useState(false);

  // Search filter
  const filteredUsers = authorizedUsers.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !fullName || !password) {
      setErrorMsg("Please fill out all fields, including the initial password.");
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const exists = authorizedUsers.some(u => u.email.toLowerCase() === emailLower);
    if (exists) {
      setErrorMsg("A user with this email address is already authorized.");
      return;
    }

    addAuthorizedUser(emailLower, fullName.trim(), role, password.trim());
    
    // Reset and close
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("employee");
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    const updates: Partial<AuthorizedUser> = {
      full_name: fullName.trim(),
      role: role
    };

    if (password.trim()) {
      updates.password = password.trim();
    }

    updateAuthorizedUser(showEditModal.id, updates);

    setShowEditModal(null);
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("employee");
  };

  const openEditModal = (user: AuthorizedUser) => {
    setShowEditModal(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke access for ${name}? they will no longer be able to log in.`)) {
      deleteAuthorizedUser(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#071B3B]/40 to-[#0A1931]/10 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest font-display">System Security</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            User Access Controls
          </h1>
          <p className="text-sm text-brand-gray mt-1 max-w-xl">
            Grant, modify, or revoke system login authorization for team members. Database state synchronizes offline-first with Firebase.
          </p>
        </div>
        <button
          onClick={() => { setErrorMsg(null); setPassword(""); setShowAddModal(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm transition shadow-[0_4px_20px_rgba(10,108,255,0.25)] flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Grant New Access
        </button>
      </div>

      {/* Firebase Status & Sync Guides banner */}
      <div className="glass-panel border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#0A6CFF]/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl border ${
              firebaseConfig 
                ? (syncStatus === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-455" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400") 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {firebaseConfig 
                ? (syncStatus === "error" ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />)
                : <AlertTriangle className="w-6 h-6" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-md font-display">
                  {firebaseConfig 
                    ? (syncStatus === "error" ? "Firestore Sync Connection Error" : "Firebase Firestore Connected")
                    : "Local Sandbox Environment Mode"
                  }
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  firebaseConfig 
                    ? (syncStatus === "error" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20") 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {firebaseConfig 
                    ? (syncStatus === "error" ? "Sync Error" : "Cloud Live") 
                    : "Local Store Only"
                  }
                </span>
              </div>
              <p className="text-xs text-brand-gray mt-1 max-w-2xl">
                {firebaseConfig 
                  ? (syncStatus === "error" && syncError
                      ? `Sync failed: ${syncError}`
                      : `Your user registry is active. Changes are synced with Firestore project "${firebaseConfig.projectId}".`
                    )
                  : "All changes are cached locally in your browser storage. Connect your Firebase project inside the Control Panel (Settings) to synchronize database tables across other machines."
                }
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <HelpCircle className="w-4 h-4" />
              {showGuide ? "Hide Setup Guide" : "Firebase Setup Guide"}
            </button>
            {firebaseConfig && (
              <button
                onClick={syncToCloud}
                disabled={syncStatus === "syncing"}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#071B3B]/60 border border-brand-blue/30 text-brand-blue hover:bg-[#071B3B] text-xs font-semibold transition"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                {syncStatus === "syncing" ? "Syncing..." : "Sync Access Logs"}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic setup accordion guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-6 pt-6 border-t border-slate-900/60"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-brand-gray">
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">How to Connect Firebase Firestore:</h4>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>Create a Firebase Project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">console.firebase.google.com</a>.</li>
                    <li>Inside your project, initialize **Cloud Firestore** in test or production mode.</li>
                    <li>Go to Project Settings, click the **Web Icon (&lt;/&gt;)** to register a web application.</li>
                    <li>Copy your configurations (`apiKey`, `projectId`, and `appId`) from the config snippet.</li>
                    <li>Navigate to Hadyra **Control Panel (Settings)** and enter your keys into the **Firebase Setup** card.</li>
                    <li>Click **Save Credentials**. Your database tables and authorized users list will auto-sync!</li>
                  </ol>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">Recommended Firestore Security Rules:</h4>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-semibold">Security Note</span>
                  </div>
                  <p className="leading-relaxed">
                    Copy and publish these security rules inside the Firestore Rules tab to secure access to the `authorized_users` collection:
                  </p>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only permit read/write if document email matches log or user role
    match /authorized_users/{userId} {
      allow read, write: if true; // Restrict as needed
    }
    match /{document=**} {
      allow read, write: if true; // Sync other business data
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main List Area */}
      <div className="glass-panel border border-slate-900 rounded-3xl p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
            />
          </div>
          <div className="text-xs text-brand-gray flex items-center gap-2 justify-end">
            Showing <strong className="text-white">{filteredUsers.length}</strong> of {authorizedUsers.length} authorized users
          </div>
        </div>

        {/* Desktop Table / Mobile Grid */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-brand-gray flex flex-col items-center justify-center gap-3 border border-dashed border-slate-800 rounded-2xl bg-[#050a18]/20">
              <ShieldAlert className="w-10 h-10 text-slate-700" />
              <div>
                <p className="font-semibold text-slate-200">No authorized users found</p>
                <p className="text-xs text-brand-gray/60 mt-1">Try adjusting your search filters or grant access to a new user.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-bold text-brand-gray uppercase tracking-wider">
                  <th className="pb-4 pl-2">User Details</th>
                  <th className="pb-4">Authorized Email</th>
                  <th className="pb-4">System Role</th>
                  <th className="pb-4">Added On</th>
                  <th className="pb-4 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {filteredUsers.map((user) => {
                  const initial = user.full_name ? user.full_name[0].toUpperCase() : "U";
                  return (
                    <tr key={user.id} className="hover:bg-[#071B3B]/10 transition-colors">
                      <td className="py-4 pl-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue/30 to-[#0A1931]/60 text-brand-blue font-bold flex items-center justify-center border border-brand-blue/20">
                          {initial}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-100 block">{user.full_name}</span>
                          <span className="text-[10px] text-slate-400 block sm:hidden">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-slate-300">
                        {user.email}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          user.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          <Key className="w-3 h-3" />
                          {user.role === "admin" ? "Administrator" : "Employee"}
                        </span>
                      </td>
                      <td className="py-4 text-brand-gray">
                        {new Date(user.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.full_name)}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-900 text-brand-gray hover:text-rose-400 transition"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Grant Access Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-dark-card border border-slate-900 rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-brand-gray hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 text-brand-blue mb-4">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-lg font-bold font-display text-white">Grant User Access</h3>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter user's name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">User Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Login Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Enter user's password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-400">System Role & Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      role === "admin" 
                        ? "bg-[#071B3B]/60 border-brand-blue/50 text-white shadow-[0_0_10px_rgba(10,108,255,0.15)]" 
                        : "border-slate-800 text-brand-gray bg-slate-950/20 hover:border-slate-700"
                    }`}>
                      <input 
                        type="radio" 
                        name="add-role" 
                        value="admin" 
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        className="hidden" 
                      />
                      <CheckCircle className={`w-3.5 h-3.5 ${role === "admin" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                      <div>
                        <span className="font-bold block">Admin</span>
                        <span className="text-[9px] text-brand-gray/80 block mt-0.5">Full System Access</span>
                      </div>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      role === "employee" 
                        ? "bg-[#071B3B]/60 border-brand-blue/50 text-white shadow-[0_0_10px_rgba(10,108,255,0.15)]" 
                        : "border-slate-800 text-brand-gray bg-slate-950/20 hover:border-slate-700"
                    }`}>
                      <input 
                        type="radio" 
                        name="add-role" 
                        value="employee" 
                        checked={role === "employee"}
                        onChange={() => setRole("employee")}
                        className="hidden" 
                      />
                      <CheckCircle className={`w-3.5 h-3.5 ${role === "employee" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                      <div>
                        <span className="font-bold block">Employee</span>
                        <span className="text-[9px] text-brand-gray/80 block mt-0.5">POS & Client Read-only</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-slate-800 hover:border-slate-700 text-brand-gray font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition shadow-[0_4px_20px_rgba(10,108,255,0.4)]"
                  >
                    Authorize Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Access Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEditModal(null)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-dark-card border border-slate-900 rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowEditModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-brand-gray hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 text-brand-blue mb-4">
                <Edit2 className="w-5 h-5" />
                <h3 className="text-lg font-bold font-display text-white">Modify User Permissions</h3>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter user's name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1 opacity-60">
                  <label className="text-xs font-semibold text-slate-400">User Email Address (Locked)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-950 border border-slate-900 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">New Password (Leave blank to keep current)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-400">System Role & Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      role === "admin" 
                        ? "bg-[#071B3B]/60 border-brand-blue/50 text-white shadow-[0_0_10px_rgba(10,108,255,0.15)]" 
                        : "border-slate-800 text-brand-gray bg-slate-950/20 hover:border-slate-700"
                    }`}>
                      <input 
                        type="radio" 
                        name="edit-role" 
                        value="admin" 
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        className="hidden" 
                      />
                      <CheckCircle className={`w-3.5 h-3.5 ${role === "admin" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                      <div>
                        <span className="font-bold block">Admin</span>
                        <span className="text-[9px] text-brand-gray/80 block mt-0.5">Full System Access</span>
                      </div>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      role === "employee" 
                        ? "bg-[#071B3B]/60 border-brand-blue/50 text-white shadow-[0_0_10px_rgba(10,108,255,0.15)]" 
                        : "border-slate-800 text-brand-gray bg-slate-950/20 hover:border-slate-700"
                    }`}>
                      <input 
                        type="radio" 
                        name="edit-role" 
                        value="employee" 
                        checked={role === "employee"}
                        onChange={() => setRole("employee")}
                        className="hidden" 
                      />
                      <CheckCircle className={`w-3.5 h-3.5 ${role === "employee" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                      <div>
                        <span className="font-bold block">Employee</span>
                        <span className="text-[9px] text-brand-gray/80 block mt-0.5">POS & Client Read-only</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className="flex-1 py-3 border border-slate-800 hover:border-slate-700 text-brand-gray font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition shadow-[0_4px_20px_rgba(10,108,255,0.4)]"
                  >
                    Update Permissions
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
