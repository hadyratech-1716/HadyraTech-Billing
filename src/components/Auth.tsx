"use client";

import React, { useState, useEffect } from "react";
import { useDb } from "@/context/DbContext";
import { Shield, Mail, Key, User, ArrowRight, Building, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const { login } = useDb();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("admin@hadyratech.com");
  const [password, setPassword] = useState("••••••••");
  const [name, setName] = useState("Saaqib");
  const [companyName, setCompanyName] = useState("Hadyra Tech Hub");
  const [role, setRole] = useState<"admin" | "employee">("admin");
  
  // OTP simulation states
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate moving to OTP stage for a secure feeling
    setStep("otp");
    setTimer(59);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate validating the OTP
    login(email, role);
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const nextCode = [...otpCode];
    nextCode[index] = element.value;
    setOtpCode(nextCode);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const triggerQuickLogin = (selectedRole: "admin" | "employee") => {
    const targetEmail = selectedRole === "admin" ? "admin@hadyratech.com" : "sales@hadyratech.com";
    setRole(selectedRole);
    setEmail(targetEmail);
    login(targetEmail, selectedRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02050e] relative overflow-hidden px-4">
      {/* Decorative neon backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#0A6CFF]/15 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#071B3B]/30 blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-3 rounded-2xl bg-[#071B3B]/70 border border-[#0A6CFF]/20 text-[#0A6CFF] mb-3 shadow-[0_0_20px_rgba(10,108,255,0.2)]"
          >
            <Shield className="w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-brand-gray bg-clip-text text-transparent"
          >
            HADYRA BILLING
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-brand-gray tracking-widest mt-1 uppercase"
          >
            Enterprise SaaS Billing & Inventory
          </motion.p>
        </div>

        {/* Dynamic Card Container */}
        <motion.div 
          layout
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="glass-panel rounded-3xl p-8 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials-stage"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Form Mode Tabs */}
                <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 mb-6">
                  <button
                    onClick={() => { setIsLogin(true); setRole("admin"); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isLogin ? "bg-brand-blue text-white shadow-md shadow-brand-blue/30" : "text-brand-gray hover:text-slate-200"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      !isLogin ? "bg-brand-blue text-white shadow-md shadow-brand-blue/30" : "text-brand-gray hover:text-slate-200"
                    }`}
                  >
                    Register Company
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      {/* Company Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Company Name</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            required
                            placeholder="Hadyra Retail Ltd"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Full Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Work Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-400">Password</label>
                      {isLogin && (
                        <a href="#" className="text-[10px] text-brand-blue hover:underline">
                          Forgot Password?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-brand-gray absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                      />
                    </div>
                  </div>

                  {/* Role picker for mock auth */}
                  {isLogin && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-slate-400">Role Permissions</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          role === "admin" 
                            ? "bg-[#071B3B]/60 border-brand-blue/50 text-white" 
                            : "border-slate-800 text-brand-gray bg-slate-950/20"
                        }`}>
                          <input 
                            type="radio" 
                            name="role" 
                            value="admin" 
                            checked={role === "admin"}
                            onChange={() => setRole("admin")}
                            className="hidden" 
                          />
                          <CheckCircle className={`w-3.5 h-3.5 ${role === "admin" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                          Administrator
                        </label>
                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          role === "employee" 
                            ? "bg-[#071B3B]/60 border-brand-blue/50 text-white" 
                            : "border-slate-800 text-brand-gray bg-slate-950/20"
                        }`}>
                          <input 
                            type="radio" 
                            name="role" 
                            value="employee" 
                            checked={role === "employee"}
                            onChange={() => setRole("employee")}
                            className="hidden" 
                          />
                          <CheckCircle className={`w-3.5 h-3.5 ${role === "employee" ? "text-brand-blue" : "text-transparent border border-slate-700 rounded-full"}`} />
                          Employee
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand-blue hover:bg-blue-600 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(10,108,255,0.4)] mt-6"
                  >
                    {isLogin ? "Authenticate Account" : "Register Organization"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick login helper (Saves developer setup) */}
                {isLogin && (
                  <div className="mt-8 border-t border-slate-900 pt-6 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-brand-gray block mb-3 font-semibold">
                      One-Click Demo Sandbox Bypasses
                    </span>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => triggerQuickLogin("admin")}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-brand-blue hover:text-white transition"
                      >
                        ⚡ Log In Admin
                      </button>
                      <button
                        onClick={() => triggerQuickLogin("employee")}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-brand-blue hover:text-white transition"
                      >
                        ⚡ Log In Employee
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="otp-stage"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h3 className="text-xl font-bold font-display text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-xs text-brand-gray mb-6">
                  We sent a 6-digit secure code to <br />
                  <strong className="text-slate-200">{email}</strong>
                </p>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  {/* Digital Entry boxes */}
                  <div className="flex justify-between gap-2 max-w-xs mx-auto">
                    {otpCode.map((data, index) => (
                      <input
                        key={index}
                        type="text"
                        name="otp"
                        maxLength={1}
                        className="w-12 h-12 text-center text-lg font-bold rounded-xl glass-input focus:border-brand-blue"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onFocus={(e) => e.target.select()}
                      />
                    ))}
                  </div>

                  {/* Resend details */}
                  <div className="text-xs text-brand-gray">
                    {timer > 0 ? (
                      <span>Resend code in <strong className="text-slate-200">{timer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTimer(59)}
                        className="text-brand-blue hover:underline font-semibold"
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  {/* Navigation keys */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("credentials")}
                      className="flex-1 py-3 border border-slate-800 hover:border-slate-700 text-brand-gray font-semibold rounded-xl text-sm transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition shadow-[0_4px_20px_rgba(10,108,255,0.4)]"
                    >
                      Verify & Enter
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Brand footer details */}
        <p className="text-center text-[10px] text-brand-gray/60 mt-8">
          Powered by Hadyra Technologies Cloud Systems. All connections encrypted using SSL. <br />
          Licensed for commercial distribution.
        </p>
      </div>
    </div>
  );
}
