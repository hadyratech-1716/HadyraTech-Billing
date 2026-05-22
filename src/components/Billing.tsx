"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDb, Product, Customer } from "@/context/DbContext";
import { 
  Search, Plus, Mic, MicOff, Barcode, Trash2, Printer, 
  Share2, IndianRupee, Sparkles, Check, ChevronDown, Camera,
  ShoppingCart
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  product: Product;
  quantity: number;
  sales_price: number;
  discount: number; // Flat discount per unit
  tax_rate: number;
}

export default function Billing({ onPrintInvoice, onShareInvoice }: { 
  onPrintInvoice: (invoiceId: string) => void;
  onShareInvoice: (invoiceId: string) => void;
}) {
  const { 
    activeBusiness, products, customers, addCustomer, addInvoice 
  } = useDb();

  // Selected State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "bank_transfer">("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0); // Flat bill discount

  // Dropdowns and Modals
  const [showCustModal, setShowCustModal] = useState(false);
  const [searchCustQuery, setSearchCustQuery] = useState("");
  const [searchProdQuery, setSearchProdQuery] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [showProdDropdown, setShowProdDropdown] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Barcode Camera Simulator
  const [scanning, setScanning] = useState(false);

  // New Customer Inline Form
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustGst, setNewCustGst] = useState("");

  // Voice Speech Command states
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // UPI configuration from settings
  const [upiId, setUpiId] = useState("6048894526@KKBK0008488.ifsc.npci");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hadyra_merchant_upi");
      if (stored) setUpiId(stored);
    }
  }, []);

  // Focus ref for barcode scanning
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filter lists based on business
  const bizProducts = useMemo(() => {
    return products.filter(p => p.business_id === activeBusiness?.id);
  }, [products, activeBusiness]);

  const bizCustomers = useMemo(() => {
    return customers.filter(c => c.business_id === activeBusiness?.id);
  }, [customers, activeBusiness]);

  // Compute Cart Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    
    cart.forEach(item => {
      const priceAfterDiscount = item.sales_price - item.discount;
      const itemSubtotal = priceAfterDiscount * item.quantity;
      const itemTax = itemSubtotal * (item.tax_rate / 100);
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    const totalBeforeBillDiscount = subtotal + taxAmount;
    const totalAmount = Math.max(0, totalBeforeBillDiscount - discountAmount);

    return {
      subtotal,
      taxAmount,
      totalAmount
    };
  }, [cart, discountAmount]);

  // Autocomplete Filters
  const filteredCustomers = useMemo(() => {
    if (!searchCustQuery) return [];
    return bizCustomers.filter(c => 
      c.name.toLowerCase().includes(searchCustQuery.toLowerCase()) ||
      c.phone?.includes(searchCustQuery)
    );
  }, [bizCustomers, searchCustQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchProdQuery) return [];
    return bizProducts.filter(p => 
      p.name.toLowerCase().includes(searchProdQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchProdQuery.toLowerCase()) ||
      p.barcode?.includes(searchProdQuery)
    );
  }, [bizProducts, searchProdQuery]);

  // Add Item to POS Cart
  const handleAddProductToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        sales_price: product.sales_price,
        discount: 0,
        tax_rate: product.tax_rate
      }];
    });
    setSearchProdQuery("");
    setShowProdDropdown(false);
  };

  // Barcode Scanning Heuristics
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const matched = bizProducts.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
    if (matched) {
      handleAddProductToCart(matched);
      // Spark confetti or flash screen
      setBarcodeInput("");
    } else {
      alert(`Barcode "${barcodeInput}" not found in inventory.`);
    }
  };

  // Webcam scan simulator
  const startCameraScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Pick a random product
      if (bizProducts.length > 0) {
        const randomProd = bizProducts[Math.floor(Math.random() * bizProducts.length)];
        handleAddProductToCart(randomProd);
        // Play notification tone
      }
      setScanning(false);
    }, 2000);
  };

  // Inline Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      gst_number: newCustGst,
      email: "",
      address: ""
    });

    setSelectedCustomer(created);
    setSearchCustQuery(created.name);
    setShowCustModal(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustGst("");
  };

  // Cart Adjustments
  const handleQtyChange = (index: number, val: number) => {
    setCart(prev => prev.map((item, idx) => 
      idx === index ? { ...item, quantity: Math.max(1, val) } : item
    ));
  };

  const handleRateChange = (index: number, val: number) => {
    setCart(prev => prev.map((item, idx) => 
      idx === index ? { ...item, sales_price: Math.max(0, val) } : item
    ));
  };

  const handleDiscountChange = (index: number, val: number) => {
    setCart(prev => prev.map((item, idx) => 
      idx === index ? { ...item, discount: Math.max(0, val) } : item
    ));
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Invoice & Generate Record
  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      alert("Billing cart is empty.");
      return;
    }

    const totalBeforeBillDiscount = calculations.subtotal + calculations.taxAmount;
    
    // Format cart items for database
    const invoiceItems = cart.map(item => {
      const rate = item.sales_price - item.discount;
      const sub = rate * item.quantity;
      const tax = sub * (item.tax_rate / 100);
      return {
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.sales_price,
        tax_rate: item.tax_rate,
        tax_amount: tax,
        discount: item.discount,
        total: sub + tax
      };
    });

    const isPaid = amountPaid >= calculations.totalAmount ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    const created = addInvoice({
      customer_id: selectedCustomer?.id || undefined,
      invoice_date: new Date().toISOString().split("T")[0],
      subtotal: calculations.subtotal,
      tax_amount: calculations.taxAmount,
      discount_amount: discountAmount,
      total_amount: calculations.totalAmount,
      amount_paid: amountPaid,
      payment_status: isPaid,
      payment_method: paymentMethod,
      notes: notes || "No items comments recorded."
    }, invoiceItems);

    // Spark confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#0A6CFF", "#071B3B", "#FFFFFF"]
    });

    // Reset Billing Form
    setCart([]);
    setSelectedCustomer(null);
    setSearchCustQuery("");
    setAmountPaid(0);
    setDiscountAmount(0);
    setNotes("");

    // Ask to print
    onPrintInvoice(created.id);
  };

  // Voice Command Heuristics Parser
  function parseVoiceCommand(cmd: string) {
    // 1. Clear Cart command
    if (cmd.includes("clear") || cmd.includes("empty cart")) {
      setCart([]);
      setVoiceTranscript("Cleared billing cart.");
      return;
    }

    // 2. Set Discount Command
    if (cmd.includes("discount")) {
      const numbers = cmd.match(/\d+/);
      if (numbers) {
        setDiscountAmount(Number(numbers[0]));
        setVoiceTranscript(`Applied discount ₹${numbers[0]}`);
      }
      return;
    }

    // 3. Add item command: "add [qty] [name]" or simply "[qty] [name]"
    // Regex matches quantity and item keywords
    const addRegex = /(?:add\s+)?(\d+)\s+(.+)/i;
    const match = cmd.match(addRegex);
    if (match) {
      const qty = parseInt(match[1]);
      const searchName = match[2].trim();

      // Find matching product
      const productMatch = bizProducts.find(p => 
        p.name.toLowerCase().includes(searchName) || 
        p.sku?.toLowerCase().includes(searchName)
      );

      if (productMatch) {
        setCart(prev => {
          const existing = prev.find(item => item.product.id === productMatch.id);
          if (existing) {
            return prev.map(item => 
              item.product.id === productMatch.id 
                ? { ...item, quantity: item.quantity + qty }
                : item
            );
          }
          return [...prev, {
            product: productMatch,
            quantity: qty,
            sales_price: productMatch.sales_price,
            discount: 0,
            tax_rate: productMatch.tax_rate
          }];
        });
        setVoiceTranscript(`Added ${qty} units of "${productMatch.name}"`);
      } else {
        setVoiceTranscript(`Product matching "${searchName}" not found.`);
      }
    } else {
      // Direct search match if no quantity mentioned
      const productMatch = bizProducts.find(p => p.name.toLowerCase().includes(cmd));
      if (productMatch) {
        handleAddProductToCart(productMatch);
        setVoiceTranscript(`Added 1 unit of "${productMatch.name}"`);
      } else {
        setVoiceTranscript(`Command "${cmd}" not recognized.`);
      }
    }
  }

  // Initialize Speech recognition hook
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set to Indian English for easy numeric parsing

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceTranscript(transcript);
        parseVoiceCommand(transcript);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [bizProducts]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceTranscript("Listening for commands...");
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">POS Billing Cart</h1>
          <p className="text-xs md:text-sm text-brand-gray">Create GST invoices, add credits, and collect UPI payments.</p>
        </div>

        {/* Action Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Voice Billing widget */}
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              isListening 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-slate-900 border border-slate-800 text-brand-gray hover:text-white"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>Voice commands</span>
          </button>

          {/* Barcode mode toggle */}
          <button
            onClick={() => setBarcodeMode(!barcodeMode)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
              barcodeMode 
                ? "bg-brand-blue border-brand-blue text-white" 
                : "bg-slate-900 border-slate-800 text-brand-gray hover:text-white"
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Barcode Mode</span>
          </button>
        </div>
      </div>

      {/* Voice feedback log */}
      {voiceTranscript && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-brand-navy/30 border border-brand-blue/10 rounded-xl flex items-center gap-2 text-xs text-brand-blue font-mono"
        >
          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          <span>Heuristics Transcriptor: {voiceTranscript}</span>
        </motion.div>
      )}

      {/* Barcode Search Box */}
      <AnimatePresence>
        {barcodeMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 w-full relative">
                <Barcode className="w-5 h-5 text-brand-blue absolute left-3.5 top-3" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan product barcode, SKU, or type and hit Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl glass-input"
                  autoFocus
                />
              </form>
              <button
                onClick={startCameraScan}
                disabled={scanning}
                className="w-full md:w-auto px-4 py-2.5 bg-brand-blue/15 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/20 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4.5 h-4.5" />
                {scanning ? "Scanning Camera..." : "Simulate Camera Scan"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera scan loader overlay */}
      {scanning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
          <div className="relative w-72 h-48 border-2 border-brand-blue rounded-3xl overflow-hidden flex items-center justify-center bg-slate-900/40">
            <span className="w-full h-1 bg-brand-blue absolute top-0 left-0 animate-bounce" />
            <Barcode className="w-16 h-16 text-brand-gray animate-pulse" />
          </div>
          <p className="text-white text-sm font-semibold mt-4">Searching barcode values in store database...</p>
        </div>
      )}

      {/* Double Column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: POS Cart builder */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Autocomplete Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Search */}
            <div className="relative">
              <label className="text-[10px] text-brand-gray font-bold block mb-1.5 uppercase">SELECT CLIENT</label>
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search buyer by name or phone..."
                  value={searchCustQuery}
                  onChange={(e) => {
                    setSearchCustQuery(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl glass-input"
                />
                <button
                  onClick={() => setShowCustModal(true)}
                  className="absolute right-3 top-2.5 p-0.5 rounded bg-[#0A6CFF]/15 text-[#0A6CFF] hover:bg-[#0A6CFF]/25 transition"
                  title="Add New Customer"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Suggestions */}
              {showCustDropdown && filteredCustomers.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCustDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-900 rounded-xl p-1 shadow-2xl z-20 max-h-40 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setSearchCustQuery(c.name);
                          setShowCustDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-900 flex justify-between items-center text-slate-300"
                      >
                        <span className="font-semibold text-slate-100">{c.name}</span>
                        <span className="text-[10px] text-brand-gray">{c.phone || "No phone"}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Product Search */}
            <div className="relative">
              <label className="text-[10px] text-brand-gray font-bold block mb-1.5 uppercase">ADD PRODUCT ITEM</label>
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type product name, SKU, or category..."
                  value={searchProdQuery}
                  onChange={(e) => {
                    setSearchProdQuery(e.target.value);
                    setShowProdDropdown(true);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
                />
              </div>

              {/* Suggestions */}
              {showProdDropdown && filteredProducts.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProdDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-900 rounded-xl p-1 shadow-2xl z-20 max-h-40 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddProductToCart(p)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-900 flex justify-between items-center text-slate-300"
                      >
                        <div>
                          <span className="font-semibold text-slate-100 block">{p.name}</span>
                          <span className="text-[9px] text-brand-gray">SKU: {p.sku || "N/A"} • Stock: {p.stock_quantity}</span>
                        </div>
                        <span className="font-bold text-[#0A6CFF]">₹{p.sales_price}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Cart Table panel */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-brand-gray uppercase tracking-wider font-bold">
                    <th className="p-4">Item Details</th>
                    <th className="p-4 w-20 text-center">Qty</th>
                    <th className="p-4 w-28 text-right">Rate</th>
                    <th className="p-4 w-24 text-right">Discount</th>
                    <th className="p-4 w-20 text-center">Tax %</th>
                    <th className="p-4 w-24 text-right">Total</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950 text-xs">
                  {cart.length > 0 ? (
                    cart.map((item, idx) => {
                      const netRate = item.sales_price - item.discount;
                      const lineTotalBeforeTax = netRate * item.quantity;
                      const lineTax = lineTotalBeforeTax * (item.tax_rate / 100);
                      const lineTotal = lineTotalBeforeTax + lineTax;

                      return (
                        <tr key={idx} className="hover:bg-slate-950/10">
                          <td className="p-4">
                            <span className="font-bold text-slate-200 block truncate max-w-[160px]">{item.product.name}</span>
                            <span className="text-[10px] text-brand-gray font-mono">{item.product.sku || "No SKU"}</span>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                              className="w-full text-center px-1.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 font-semibold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.sales_price}
                              onChange={(e) => handleRateChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full text-right px-1.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 font-semibold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => handleDiscountChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full text-right px-1.5 py-1 text-xs rounded bg-slate-900 border border-slate-800 font-semibold"
                            />
                          </td>
                          <td className="p-4 text-center text-slate-400 font-semibold">
                            {item.tax_rate}%
                          </td>
                          <td className="p-4 text-right font-bold text-slate-100">
                            ₹{lineTotal.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleRemoveFromCart(idx)}
                              className="text-brand-gray hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-brand-gray">
                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-800" />
                        No product items in billing cart. Search above or scan barcode to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Checkout Payment Panel */}
        <div className="space-y-4">
          
          {/* Pricing breakdown Summary */}
          <div className="glass-panel rounded-3xl p-6 space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold text-white font-display">Invoice Summary</h3>
            
            <div className="space-y-2 border-b border-slate-950 pb-4 text-xs">
              <div className="flex justify-between text-brand-gray">
                <span>Cart Subtotal</span>
                <span>₹{calculations.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-gray">
                <span>GST Tax Value</span>
                <span>₹{calculations.taxAmount.toFixed(2)}</span>
              </div>
              
              {/* Bill-level flat discount */}
              <div className="flex justify-between items-center text-brand-gray gap-2">
                <span>Additional Discount (₹)</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-xs text-white"
                />
              </div>
            </div>

            {/* Total display */}
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold text-slate-200">Total Payable</span>
              <span className="text-2xl font-extrabold font-display text-white">₹{calculations.totalAmount.toFixed(2)}</span>
            </div>

            {/* UPI QR preview dynamically if payment method is UPI */}
            {paymentMethod === "upi" && activeBusiness && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-center space-y-2.5"
              >
                <span className="text-[10px] text-brand-gray font-bold block uppercase">DYNAMIC UPI PAYMENT QR</span>
                <div className="inline-block p-2.5 bg-white rounded-xl shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `upi://pay?pa=${upiId}&pn=${activeBusiness.name}&am=${calculations.totalAmount.toFixed(2)}&cu=INR&tn=POS-BILL`
                    )}`}
                    alt="UPI QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <span className="text-[9px] text-[#0A6CFF] font-mono block">Scan with GPay, PhonePe, Paytm</span>
              </motion.div>
            )}

            {/* Checkout Options Form */}
            <div className="space-y-3.5 pt-2 text-xs">
              
              {/* Payment Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-brand-gray font-bold uppercase">PAYMENT MODE</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cash", label: "Registry Cash" },
                    { id: "card", label: "POS Card Swipe" },
                    { id: "upi", label: "UPI Scan QR" },
                    { id: "bank_transfer", label: "Bank Wire" }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-2 border rounded-xl text-center font-medium transition-all ${
                        paymentMethod === method.id 
                          ? "bg-brand-blue border-brand-blue text-white" 
                          : "bg-slate-950/40 border-slate-850 text-brand-gray hover:text-slate-200"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount paid (for partial dues tracking) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-brand-gray font-bold uppercase">AMOUNT PAID (₹)</label>
                  <button
                    onClick={() => setAmountPaid(calculations.totalAmount)}
                    className="text-[9px] text-brand-blue font-bold hover:underline"
                  >
                    Paid in Full
                  </button>
                </div>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-semibold text-white focus:border-brand-blue focus:outline-none"
                />
              </div>

              {/* Invoice notes */}
              <div className="space-y-1">
                <label className="text-[10px] text-brand-gray font-bold uppercase">INVOICE REMARK / TERMS</label>
                <textarea
                  rows={2}
                  placeholder="Terms, return policy details, bank details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-blue focus:outline-none"
                />
              </div>

              {/* Checkout Submit */}
              <button
                onClick={handleCheckoutSubmit}
                className="w-full py-3.5 bg-brand-blue hover:bg-blue-600 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(10,108,255,0.45)] mt-4 transition-all"
              >
                <Printer className="w-4 h-4" />
                Generate & Print Invoice
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* New Customer Inline Modal */}
      <AnimatePresence>
        {showCustModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">Add Customer Profile</h3>
              <p className="text-xs text-brand-gray mb-4">Register new buyer for direct billing.</p>

              <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Customer / Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="M/s Reliance Industries"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 99000 00000"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">GST Number</label>
                    <input
                      type="text"
                      placeholder="27AAACG9012F1Z9"
                      value={newCustGst}
                      onChange={(e) => setNewCustGst(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
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
                    Save Customer
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
