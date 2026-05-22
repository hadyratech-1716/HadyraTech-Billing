"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Type Definitions
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "employee";
  active_business_id: string;
}

export interface Business {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  logo_url?: string;
  signature_url?: string;
  invoice_prefix: string;
  invoice_counter: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  purchase_price: number;
  sales_price: number;
  tax_rate: number; // e.g. 18%
  stock_quantity: number;
  min_stock_alert: number;
  category: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  loyalty_points: number;
  balance: number;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  invoice_number: string;
  customer_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: "paid" | "partial" | "unpaid";
  payment_method: "cash" | "card" | "upi" | "bank_transfer" | "multi";
  notes?: string;
  created_by?: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface Expense {
  id: string;
  business_id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  payment_method: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  user_name: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface DbContextType {
  currentUser: Profile | null;
  activeBusiness: Business | null;
  businesses: Business[];
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  logs: AuditLog[];
  syncStatus: "idle" | "syncing" | "synced" | "error";
  supabaseConfig: { url: string; anonKey: string } | null;
  
  // Auth actions
  login: (email: string, role: "admin" | "employee") => boolean;
  logout: () => void;
  
  // Business actions
  changeBusiness: (id: string) => void;
  addBusiness: (name: string, gstin?: string, phone?: string, email?: string, address?: string) => Business;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, "id" | "business_id" | "created_at">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, "id" | "business_id" | "created_at" | "loyalty_points" | "balance">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  adjustCustomerBalance: (id: string, amount: number) => void;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, "id" | "business_id" | "invoice_number" | "created_at" | "created_by">, items: Omit<InvoiceItem, "id" | "invoice_id">[]) => Invoice;
  deleteInvoice: (id: string) => void;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, "id" | "business_id" | "created_at">) => Expense;
  deleteExpense: (id: string) => void;
  
  // Audit log action
  addLog: (action: string, details?: string) => void;
  clearLogs: () => void;
  
  // Sync & settings
  saveSupabaseConfig: (url: string, anonKey: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  syncToCloud: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (jsonString: string) => boolean;
  resetToMock: () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

// Rich Mock Data sets
const MOCK_BUSINESSES: Business[] = [
  {
    id: "bus-1",
    name: "Hadyra Tech Hub (Main Branch)",
    gstin: "27AADCH3984M1Z2",
    phone: "+91 98765 43210",
    email: "billing@hadyratech.com",
    address: "Hadyra Tech Tower, Suite 400, BKC, Mumbai, Maharashtra 400051",
    currency: "INR",
    invoice_prefix: "HT-INV",
    invoice_counter: 104,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    logo_url: "",
    signature_url: ""
  },
  {
    id: "bus-2",
    name: "Hadyra Supermarket & Retail",
    gstin: "27AADCH3984M2Z4",
    phone: "+91 98765 88990",
    email: "supermarket@hadyratech.com",
    address: "Prime Street Plaza, Lower Parel, Mumbai 400013",
    currency: "INR",
    invoice_prefix: "HS-POS",
    invoice_counter: 251,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    logo_url: "",
    signature_url: ""
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    business_id: "bus-1",
    name: "Hadyra Custom Shipping Box (Large)",
    sku: "HT-BOX-L",
    barcode: "8901234567012",
    description: "Premium double-walled cardboard boxes, 50x50x50 cm, perfect for shipping heavy packing goods.",
    purchase_price: 45.00,
    sales_price: 85.00,
    tax_rate: 18.00,
    stock_quantity: 1250,
    min_stock_alert: 100,
    category: "Packaging Materials",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-2",
    business_id: "bus-1",
    name: "Bubble Wrap Roll (100 meters)",
    sku: "HT-BBL-100",
    barcode: "8901234567029",
    description: "A grade high-density bubble cushion wraps for fragility security.",
    purchase_price: 220.00,
    sales_price: 450.00,
    tax_rate: 12.00,
    stock_quantity: 8,
    min_stock_alert: 10,
    category: "Packaging Materials",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-3",
    business_id: "bus-1",
    name: "Heavy Duty Packaging Tape (Brown)",
    sku: "HT-TAPE-BR",
    barcode: "8901234567036",
    description: "Extra strong adhesive brown tape, 2 inches wide.",
    purchase_price: 20.00,
    sales_price: 40.00,
    tax_rate: 18.00,
    stock_quantity: 340,
    min_stock_alert: 50,
    category: "Packaging Materials",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-4",
    business_id: "bus-1",
    name: "Hadyra Enterprise SaaS Cloud License",
    sku: "HT-SaaS-ENT",
    barcode: "HT-SAAS-ENT",
    description: "1-year subscription for Hadyra Cloud Suite ERP with multi-business setups.",
    purchase_price: 12000.00,
    sales_price: 45000.00,
    tax_rate: 18.00,
    stock_quantity: 9999, // Infinite digital goods
    min_stock_alert: 2,
    category: "Software Licensing",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Business 2 products
  {
    id: "prod-5",
    business_id: "bus-2",
    name: "Premium Basmati Rice 5kg",
    sku: "HS-RICE-5K",
    barcode: "8901058002345",
    description: "Long-grain royal basmati rice.",
    purchase_price: 320.00,
    sales_price: 499.00,
    tax_rate: 5.00,
    stock_quantity: 120,
    min_stock_alert: 15,
    category: "Groceries",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-6",
    business_id: "bus-2",
    name: "Organic Honey 500g",
    sku: "HS-HNY-500",
    barcode: "8901058004561",
    description: "Pure wild forest organic honey.",
    purchase_price: 180.00,
    sales_price: 290.00,
    tax_rate: 12.00,
    stock_quantity: 4,
    min_stock_alert: 10,
    category: "Groceries",
    created_at: new Date().toISOString()
  }
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    business_id: "bus-1",
    name: "Global Logistics & Co.",
    phone: "+91 99001 12233",
    email: "billing@globallogistics.com",
    address: "Building B4, SEZ Industrial Zone, Pune, Maharashtra 411028",
    gst_number: "27AAACG9012F1Z9",
    loyalty_points: 350,
    balance: 14500.00, // Due balance
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "cust-2",
    business_id: "bus-1",
    name: "Rajesh Packaging & Distributors",
    phone: "+91 98333 44555",
    email: "rajeshpack@gmail.com",
    address: "Shop No 14, APMC Market, Vashi, Navi Mumbai 400703",
    gst_number: "27AADPR4031H1ZG",
    loyalty_points: 120,
    balance: 0.00,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "cust-3",
    business_id: "bus-1",
    name: "Anita Sharma (Retail Walk-in)",
    phone: "+91 97777 66554",
    email: "anita.sharma@yahoo.com",
    address: "Flat 202, Heights Apartment, Bandra, Mumbai 400050",
    gst_number: "",
    loyalty_points: 45,
    balance: 450.00,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    business_id: "bus-1",
    invoice_number: "HT-INV-101",
    customer_id: "cust-1",
    invoice_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: 10000.00,
    tax_amount: 1800.00,
    discount_amount: 500.00,
    total_amount: 11300.00,
    amount_paid: 0.00,
    payment_status: "unpaid",
    payment_method: "upi",
    notes: "Please clear the payment on or before the due date. Standard interest charges of 1.5% monthly applicable post-due.",
    created_by: "user-1",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "inv-2",
    business_id: "bus-1",
    invoice_number: "HT-INV-102",
    customer_id: "cust-2",
    invoice_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    due_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: 4250.00,
    tax_amount: 725.00,
    discount_amount: 250.00,
    total_amount: 4725.00,
    amount_paid: 4725.00,
    payment_status: "paid",
    payment_method: "bank_transfer",
    notes: "Thank you for doing business with Hadyra Technologies!",
    created_by: "user-1",
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "inv-3",
    business_id: "bus-1",
    invoice_number: "HT-INV-103",
    customer_id: "cust-1",
    invoice_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: 5000.00,
    tax_amount: 800.00,
    discount_amount: 0.00,
    total_amount: 5800.00,
    amount_paid: 2600.00,
    payment_status: "partial",
    payment_method: "multi",
    notes: "Partial payment received via UPI cash registry.",
    created_by: "user-1",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_INVOICE_ITEMS: InvoiceItem[] = [
  {
    id: "item-1",
    invoice_id: "inv-1",
    product_id: "prod-1",
    name: "Hadyra Custom Shipping Box (Large)",
    quantity: 100,
    price: 85.00,
    tax_rate: 18.00,
    tax_amount: 1440.00,
    discount: 500.00,
    total: 9440.00
  },
  {
    id: "item-2",
    invoice_id: "inv-1",
    product_id: "prod-3",
    name: "Heavy Duty Packaging Tape (Brown)",
    quantity: 50,
    price: 40.00,
    tax_rate: 18.00,
    tax_amount: 360.00,
    discount: 0.00,
    total: 2360.00
  },
  {
    id: "item-3",
    invoice_id: "inv-2",
    product_id: "prod-2",
    name: "Bubble Wrap Roll (100 meters)",
    quantity: 10,
    price: 450.00,
    tax_rate: 12.00,
    tax_amount: 510.00,
    discount: 250.00,
    total: 4760.00 // Adjust math slightly for display
  },
  {
    id: "item-4",
    invoice_id: "inv-3",
    product_id: "prod-1",
    name: "Hadyra Custom Shipping Box (Large)",
    quantity: 50,
    price: 85.00,
    tax_rate: 18.00,
    tax_amount: 765.00,
    discount: 0.00,
    total: 5015.00
  }
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    business_id: "bus-1",
    amount: 15000.00,
    category: "Office Rent",
    description: "Monthly lease payment for BKC main office.",
    date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    payment_method: "bank_transfer",
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "exp-2",
    business_id: "bus-1",
    amount: 3500.00,
    category: "Electricity",
    description: "TATA Power electricity grid dues.",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    payment_method: "card",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "exp-3",
    business_id: "bus-1",
    amount: 1800.00,
    category: "Internet & IT",
    description: "JioFiber Business broadband subscription.",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    payment_method: "upi",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    business_id: "bus-1",
    user_name: "Saaqib (Admin)",
    action: "SYSTEM_INITIALIZE",
    details: "Hadyra Billing engine successfully initialized.",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-2",
    business_id: "bus-1",
    user_name: "Saaqib (Admin)",
    action: "PRODUCT_ADD",
    details: "Added new product: Bubble Wrap Roll (100 meters)",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-3",
    business_id: "bus-1",
    user_name: "Saaqib (Admin)",
    action: "INVOICE_CREATE",
    details: "Issued Invoice #HT-INV-101 to Global Logistics & Co. (Total: ₹11,300.00)",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State variables
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anonKey: string } | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  // Load from LocalStorage or seed mock data
  useEffect(() => {
    // Check if configuration exists
    const storedUser = localStorage.getItem("hadyra_user");
    const storedBizConfig = localStorage.getItem("hadyra_active_business_id");
    const storedBusinesses = localStorage.getItem("hadyra_businesses");
    const storedProducts = localStorage.getItem("hadyra_products");
    const storedCustomers = localStorage.getItem("hadyra_customers");
    const storedInvoices = localStorage.getItem("hadyra_invoices");
    const storedExpenses = localStorage.getItem("hadyra_expenses");
    const storedLogs = localStorage.getItem("hadyra_logs");
    const storedSupabase = localStorage.getItem("hadyra_supabase_config");

    if (storedSupabase) {
      try {
        const parsed = JSON.parse(storedSupabase);
        setSupabaseConfig(parsed);
        setSupabaseClient(createClient(parsed.url, parsed.anonKey));
      } catch (e) {
        console.error("Error loading Supabase config", e);
      }
    }

    // Set user
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        setCurrentUser({
          id: "user-1",
          email: "admin@hadyratech.com",
          full_name: "Saaqib",
          role: "admin",
          active_business_id: "bus-1"
        });
      }
    } else {
      const defaultUser: Profile = {
        id: "user-1",
        email: "admin@hadyratech.com",
        full_name: "Saaqib",
        role: "admin",
        active_business_id: "bus-1"
      };
      setCurrentUser(defaultUser);
      localStorage.setItem("hadyra_user", JSON.stringify(defaultUser));
    }

    // Populate data
    if (storedBusinesses) {
      try {
        const parsedBiz = JSON.parse(storedBusinesses);
        setBusinesses(parsedBiz);
        if (storedBizConfig) {
          const matched = parsedBiz.find((b: Business) => b.id === storedBizConfig);
          setActiveBusiness(matched || parsedBiz[0]);
        } else {
          setActiveBusiness(parsedBiz[0]);
        }
      } catch (e) {
        seedMockData();
      }
    } else {
      seedMockData();
    }

    if (storedProducts) {
      try { setProducts(JSON.parse(storedProducts)); } catch (e) { setProducts(MOCK_PRODUCTS); }
    }
    if (storedCustomers) {
      try { setCustomers(JSON.parse(storedCustomers)); } catch (e) { setCustomers(MOCK_CUSTOMERS); }
    }
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); } catch (e) { setInvoices(MOCK_INVOICES); }
    }
    if (storedExpenses) {
      try { setExpenses(JSON.parse(storedExpenses)); } catch (e) { setExpenses(MOCK_EXPENSES); }
    }
    if (storedLogs) {
      try { setLogs(JSON.parse(storedLogs)); } catch (e) { setLogs(MOCK_AUDIT_LOGS); }
    }
  }, []);

  const seedMockData = () => {
    setBusinesses(MOCK_BUSINESSES);
    setActiveBusiness(MOCK_BUSINESSES[0]);
    setProducts(MOCK_PRODUCTS);
    setCustomers(MOCK_CUSTOMERS);
    setInvoices(MOCK_INVOICES);
    setExpenses(MOCK_EXPENSES);
    setLogs(MOCK_AUDIT_LOGS);

    localStorage.setItem("hadyra_businesses", JSON.stringify(MOCK_BUSINESSES));
    localStorage.setItem("hadyra_active_business_id", MOCK_BUSINESSES[0].id);
    localStorage.setItem("hadyra_products", JSON.stringify(MOCK_PRODUCTS));
    localStorage.setItem("hadyra_customers", JSON.stringify(MOCK_CUSTOMERS));
    localStorage.setItem("hadyra_invoices", JSON.stringify(MOCK_INVOICES));
    localStorage.setItem("hadyra_expenses", JSON.stringify(MOCK_EXPENSES));
    localStorage.setItem("hadyra_logs", JSON.stringify(MOCK_AUDIT_LOGS));
  };

  // Syncer helper to write local states to browser cache
  const saveLocal = (key: string, data: any) => {
    localStorage.setItem(`hadyra_${key}`, JSON.stringify(data));
  };

  // Logger helper
  const addLogLocal = (action: string, details?: string, customLogsState?: AuditLog[]) => {
    if (!activeBusiness) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      business_id: activeBusiness.id,
      user_id: currentUser?.id || "anonymous",
      user_name: currentUser ? `${currentUser.full_name} (${currentUser.role})` : "System",
      action,
      details,
      created_at: new Date().toISOString()
    };
    const targetArray = customLogsState || logs;
    const updated = [newLog, ...targetArray].slice(0, 200); // Keep last 200 logs
    setLogs(updated);
    saveLocal("logs", updated);

    // If Supabase is active, async push log
    if (supabaseClient) {
      supabaseClient.from("audit_logs").insert([newLog]).then(({ error }) => {
        if (error) console.error("Cloud audit log failed", error);
      });
    }
  };

  // Auth Operations
  const login = (email: string, role: "admin" | "employee"): boolean => {
    // Basic verification simulation
    const name = role === "admin" ? "Saaqib" : "Vikram Mehta";
    const loggedUser: Profile = {
      id: role === "admin" ? "user-1" : "user-2",
      email,
      full_name: name,
      role,
      active_business_id: activeBusiness?.id || "bus-1"
    };
    setCurrentUser(loggedUser);
    localStorage.setItem("hadyra_user", JSON.stringify(loggedUser));
    
    // Add log
    setTimeout(() => {
      addLogLocal("USER_LOGIN", `User ${name} logged in successfully with role: ${role}`);
    }, 100);
    return true;
  };

  const logout = () => {
    addLogLocal("USER_LOGOUT", `User logged out`);
    setCurrentUser(null);
    localStorage.removeItem("hadyra_user");
  };

  // Business Operations
  const changeBusiness = (id: string) => {
    const matched = businesses.find((b) => b.id === id);
    if (matched) {
      setActiveBusiness(matched);
      localStorage.setItem("hadyra_active_business_id", id);
      if (currentUser) {
        const updatedUser = { ...currentUser, active_business_id: id };
        setCurrentUser(updatedUser);
        localStorage.setItem("hadyra_user", JSON.stringify(updatedUser));
      }
      // Add log
      setTimeout(() => {
        addLogLocal("BUSINESS_SWITCH", `Switched to business: ${matched.name}`);
      }, 50);
    }
  };

  const addBusiness = (name: string, gstin?: string, phone?: string, email?: string, address?: string): Business => {
    const newBiz: Business = {
      id: `bus-${Date.now()}`,
      name,
      gstin,
      phone,
      email,
      address,
      currency: "INR",
      invoice_prefix: name.split(" ").map(w => w[0]).join("").toUpperCase() + "-INV",
      invoice_counter: 1,
      created_at: new Date().toISOString(),
      logo_url: "",
      signature_url: ""
    };
    const updated = [...businesses, newBiz];
    setBusinesses(updated);
    saveLocal("businesses", updated);
    
    // Switch to it immediately
    setActiveBusiness(newBiz);
    localStorage.setItem("hadyra_active_business_id", newBiz.id);
    if (currentUser) {
      const updatedUser = { ...currentUser, active_business_id: newBiz.id };
      setCurrentUser(updatedUser);
      localStorage.setItem("hadyra_user", JSON.stringify(updatedUser));
    }
    
    setTimeout(() => {
      addLogLocal("BUSINESS_CREATE", `Created new business: ${name}`);
    }, 50);

    if (supabaseClient) {
      supabaseClient.from("businesses").insert([newBiz]).then();
    }

    return newBiz;
  };

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    const updated = businesses.map((b) => {
      if (b.id === id) {
        const merged = { ...b, ...updates };
        if (activeBusiness && activeBusiness.id === id) {
          setActiveBusiness(merged);
        }
        return merged;
      }
      return b;
    });
    setBusinesses(updated);
    saveLocal("businesses", updated);
    
    setTimeout(() => {
      addLogLocal("BUSINESS_UPDATE", `Updated configuration for business ID: ${id}`);
    }, 50);

    if (supabaseClient) {
      supabaseClient.from("businesses").update(updates).eq("id", id).then();
    }
  };

  // Product Operations
  const addProduct = (prodData: Omit<Product, "id" | "business_id" | "created_at">): Product => {
    if (!activeBusiness) throw new Error("No active business selected");
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      business_id: activeBusiness.id,
      created_at: new Date().toISOString()
    };
    const updated = [...products, newProd];
    setProducts(updated);
    saveLocal("products", updated);
    
    addLogLocal("PRODUCT_ADD", `Added item: ${newProd.name} (SKU: ${newProd.sku || "N/A"}, Stock: ${newProd.stock_quantity})`);

    if (supabaseClient) {
      supabaseClient.from("products").insert([newProd]).then();
    }
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    });
    setProducts(updated);
    saveLocal("products", updated);

    const match = products.find(p => p.id === id);
    addLogLocal("PRODUCT_UPDATE", `Updated item details for: ${match?.name || id}`);

    if (supabaseClient) {
      supabaseClient.from("products").update(updates).eq("id", id).then();
    }
  };

  const deleteProduct = (id: string) => {
    const match = products.find(p => p.id === id);
    const filtered = products.filter((p) => p.id !== id);
    setProducts(filtered);
    saveLocal("products", filtered);

    addLogLocal("PRODUCT_DELETE", `Removed item: ${match?.name || id}`);

    if (supabaseClient) {
      supabaseClient.from("products").delete().eq("id", id).then();
    }
  };

  // Customer Operations
  const addCustomer = (custData: Omit<Customer, "id" | "business_id" | "created_at" | "loyalty_points" | "balance">): Customer => {
    if (!activeBusiness) throw new Error("No active business selected");
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      business_id: activeBusiness.id,
      loyalty_points: 0,
      balance: 0.00,
      created_at: new Date().toISOString()
    };
    const updated = [...customers, newCust];
    setCustomers(updated);
    saveLocal("customers", updated);

    addLogLocal("CUSTOMER_ADD", `Registered new client: ${newCust.name} (Phone: ${newCust.phone || "N/A"})`);

    if (supabaseClient) {
      supabaseClient.from("customers").insert([newCust]).then();
    }
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return { ...c, ...updates };
      }
      return c;
    });
    setCustomers(updated);
    saveLocal("customers", updated);

    const match = customers.find(c => c.id === id);
    addLogLocal("CUSTOMER_UPDATE", `Updated details for customer: ${match?.name || id}`);

    if (supabaseClient) {
      supabaseClient.from("customers").update(updates).eq("id", id).then();
    }
  };

  const adjustCustomerBalance = (id: string, amount: number) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return { ...c, balance: Math.max(0, c.balance + amount) };
      }
      return c;
    });
    setCustomers(updated);
    saveLocal("customers", updated);

    if (supabaseClient) {
      const match = customers.find(c => c.id === id);
      if (match) {
        supabaseClient.from("customers").update({ balance: Math.max(0, match.balance + amount) }).eq("id", id).then();
      }
    }
  };

  // Invoice Operations
  const addInvoice = (
    invData: Omit<Invoice, "id" | "business_id" | "invoice_number" | "created_at" | "created_by">,
    itemsData: Omit<InvoiceItem, "id" | "invoice_id">[]
  ): Invoice => {
    if (!activeBusiness) throw new Error("No active business selected");
    
    // Generate invoice number
    const serial = String(activeBusiness.invoice_counter).padStart(4, "0");
    const invNumber = `${activeBusiness.invoice_prefix}-${serial}`;
    const invId = `inv-${Date.now()}`;

    // Map items
    const parsedItems: InvoiceItem[] = itemsData.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      invoice_id: invId
    }));

    const newInvoice: Invoice = {
      ...invData,
      id: invId,
      business_id: activeBusiness.id,
      invoice_number: invNumber,
      created_by: currentUser?.id || "user-1",
      created_at: new Date().toISOString(),
      items: parsedItems
    };

    // Save invoices
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveLocal("invoices", updatedInvoices);

    // Save line items to local DB if we had a flat table, here we nest them.
    // Update inventory stock quantities for local products
    const updatedProducts = products.map((prod) => {
      const soldItem = itemsData.find((i) => i.product_id === prod.id);
      if (soldItem) {
        return {
          ...prod,
          stock_quantity: Math.max(0, prod.stock_quantity - soldItem.quantity)
        };
      }
      return prod;
    });
    setProducts(updatedProducts);
    saveLocal("products", updatedProducts);

    // Update customer outstanding balance if unpaid or partial
    if (invData.customer_id && (invData.payment_status === "unpaid" || invData.payment_status === "partial")) {
      const balanceOwed = invData.total_amount - invData.amount_paid;
      const updatedCustomers = customers.map((c) => {
        if (c.id === invData.customer_id) {
          return {
            ...c,
            balance: c.balance + balanceOwed,
            loyalty_points: c.loyalty_points + Math.floor(invData.total_amount / 100) // 1 point per ₹100
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      saveLocal("customers", updatedCustomers);

      if (supabaseClient) {
        const target = customers.find(c => c.id === invData.customer_id);
        if (target) {
          supabaseClient.from("customers").update({
            balance: target.balance + balanceOwed,
            loyalty_points: target.loyalty_points + Math.floor(invData.total_amount / 100)
          }).eq("id", target.id).then();
        }
      }
    }

    // Increment business invoice counter
    const updatedBusinesses = businesses.map((b) => {
      if (b.id === activeBusiness.id) {
        const nextBiz = { ...b, invoice_counter: b.invoice_counter + 1 };
        setActiveBusiness(nextBiz);
        return nextBiz;
      }
      return b;
    });
    setBusinesses(updatedBusinesses);
    saveLocal("businesses", updatedBusinesses);

    addLogLocal("INVOICE_CREATE", `Created Invoice ${invNumber} for Total: ₹${newInvoice.total_amount.toFixed(2)} (${newInvoice.payment_status.toUpperCase()})`);

    // Sync to Supabase if connected
    if (supabaseClient) {
      // 1. Insert Invoice
      const { items, ...sqlInvoice } = newInvoice;
      supabaseClient.from("invoices").insert([sqlInvoice]).then(({ error }) => {
        if (!error && items) {
          // 2. Insert items
          supabaseClient.from("invoice_items").insert(items).then();
        }
      });
      // 3. Update stock levels on Supabase
      itemsData.forEach((item) => {
        if (item.product_id) {
          const match = products.find(p => p.id === item.product_id);
          if (match) {
            supabaseClient.from("products").update({
              stock_quantity: Math.max(0, match.stock_quantity - item.quantity)
            }).eq("id", item.product_id).then();
          }
        }
      });
      // 4. Update Business Counter on Supabase
      supabaseClient.from("businesses").update({
        invoice_counter: activeBusiness.invoice_counter + 1
      }).eq("id", activeBusiness.id).then();
    }

    return newInvoice;
  };

  const deleteInvoice = (id: string) => {
    const match = invoices.find((inv) => inv.id === id);
    if (!match) return;

    const filtered = invoices.filter((inv) => inv.id !== id);
    setInvoices(filtered);
    saveLocal("invoices", filtered);

    addLogLocal("INVOICE_DELETE", `Cancelled/Deleted Invoice ${match.invoice_number}`);

    if (supabaseClient) {
      supabaseClient.from("invoices").delete().eq("id", id).then();
    }
  };

  // Expense Operations
  const addExpense = (expData: Omit<Expense, "id" | "business_id" | "created_at">): Expense => {
    if (!activeBusiness) throw new Error("No active business selected");
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      business_id: activeBusiness.id,
      created_at: new Date().toISOString()
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveLocal("expenses", updated);

    addLogLocal("EXPENSE_ADD", `Logged Expense: ₹${newExp.amount.toFixed(2)} under category "${newExp.category}"`);

    if (supabaseClient) {
      supabaseClient.from("expenses").insert([newExp]).then();
    }
    return newExp;
  };

  const deleteExpense = (id: string) => {
    const match = expenses.find((e) => e.id === id);
    const filtered = expenses.filter((e) => e.id !== id);
    setExpenses(filtered);
    saveLocal("expenses", filtered);

    addLogLocal("EXPENSE_DELETE", `Removed Expense of ₹${match?.amount || id}`);

    if (supabaseClient) {
      supabaseClient.from("expenses").delete().eq("id", id).then();
    }
  };

  // Audit Logs
  const addLog = (action: string, details?: string) => {
    addLogLocal(action, details);
  };

  const clearLogs = () => {
    setLogs([]);
    saveLocal("logs", []);
  };

  // Supabase Custom Config
  const saveSupabaseConfig = async (url: string, anonKey: string): Promise<boolean> => {
    try {
      setSyncStatus("syncing");
      const client = createClient(url, anonKey);
      
      // Test the client connection by calling standard schema auth
      const { error } = await client.from("businesses").select("id").limit(1);
      
      if (error && error.code !== "PGRST116") { // Ignore empty database table errors
        console.warn("Connection verification warnings (tables might not exist):", error.message);
      }

      setSupabaseConfig({ url, anonKey });
      setSupabaseClient(client);
      localStorage.setItem("hadyra_supabase_config", JSON.stringify({ url, anonKey }));
      setSyncStatus("synced");
      addLogLocal("CLOUD_CONNECT", `Connected to cloud database (Supabase): ${url}`);
      return true;
    } catch (e: any) {
      setSyncStatus("error");
      addLogLocal("CLOUD_CONNECT_FAIL", `Supabase registration failed: ${e.message}`);
      return false;
    }
  };

  const disconnectSupabase = () => {
    setSupabaseConfig(null);
    setSupabaseClient(null);
    localStorage.removeItem("hadyra_supabase_config");
    setSyncStatus("idle");
    addLogLocal("CLOUD_DISCONNECT", "Cloud database synchronization disconnected.");
  };

  // Bulk Sync to Cloud
  const syncToCloud = async () => {
    if (!supabaseClient) {
      setSyncStatus("error");
      return;
    }

    try {
      setSyncStatus("syncing");
      
      // Upload businesses
      if (businesses.length > 0) {
        await supabaseClient.from("businesses").upsert(businesses);
      }

      // Upload products
      if (products.length > 0) {
        await supabaseClient.from("products").upsert(products);
      }

      // Upload customers
      if (customers.length > 0) {
        await supabaseClient.from("customers").upsert(customers);
      }

      // Upload invoices & their line items
      if (invoices.length > 0) {
        const invoiceInsertables = invoices.map(({ items, ...inv }) => inv);
        await supabaseClient.from("invoices").upsert(invoiceInsertables);
        
        // Flatten and extract items
        const invoiceItemsFlattened: InvoiceItem[] = [];
        invoices.forEach((inv) => {
          if (inv.items && inv.items.length > 0) {
            invoiceItemsFlattened.push(...inv.items);
          }
        });
        
        if (invoiceItemsFlattened.length > 0) {
          await supabaseClient.from("invoice_items").upsert(invoiceItemsFlattened);
        }
      }

      // Upload expenses
      if (expenses.length > 0) {
        await supabaseClient.from("expenses").upsert(expenses);
      }

      // Upload logs
      if (logs.length > 0) {
        await supabaseClient.from("audit_logs").upsert(logs);
      }

      setSyncStatus("synced");
      addLogLocal("CLOUD_SYNC", "Manual sync completed. All offline records pushed to cloud.");
    } catch (e: any) {
      setSyncStatus("error");
      addLogLocal("CLOUD_SYNC_FAIL", `Cloud database synchronization failed: ${e.message}`);
    }
  };

  // Backups
  const exportBackup = () => {
    const backupData = {
      businesses,
      products,
      customers,
      invoices,
      expenses,
      logs,
      version: "1.0",
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HADYRA_BILLING_BACKUP_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addLogLocal("BACKUP_EXPORT", "Offline system backup exported successfully.");
  };

  const importBackup = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.businesses || !data.products || !data.customers || !data.invoices) {
        return false;
      }

      setBusinesses(data.businesses);
      setProducts(data.products);
      setCustomers(data.customers);
      setInvoices(data.invoices);
      setExpenses(data.expenses || []);
      setLogs(data.logs || []);

      if (data.businesses.length > 0) {
        setActiveBusiness(data.businesses[0]);
        localStorage.setItem("hadyra_active_business_id", data.businesses[0].id);
      }

      saveLocal("businesses", data.businesses);
      saveLocal("products", data.products);
      saveLocal("customers", data.customers);
      saveLocal("invoices", data.invoices);
      saveLocal("expenses", data.expenses || []);
      saveLocal("logs", data.logs || []);

      setTimeout(() => {
        addLogLocal("BACKUP_IMPORT", "System configuration restored from JSON backup file.");
      }, 100);

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetToMock = () => {
    seedMockData();
    addLogLocal("SYSTEM_RESET", "Database reset to factory mock demonstration records.");
  };

  return (
    <DbContext.Provider
      value={{
        currentUser,
        activeBusiness,
        businesses,
        products,
        customers,
        invoices,
        expenses,
        logs,
        syncStatus,
        supabaseConfig,
        login,
        logout,
        changeBusiness,
        addBusiness,
        updateBusiness,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        adjustCustomerBalance,
        addInvoice,
        deleteInvoice,
        addExpense,
        deleteExpense,
        addLog,
        clearLogs,
        saveSupabaseConfig,
        disconnectSupabase,
        syncToCloud,
        exportBackup,
        importBackup,
        resetToMock
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error("useDb must be used within a DbProvider");
  }
  return context;
};
