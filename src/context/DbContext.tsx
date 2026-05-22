"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, writeBatch, collection, getDocs } from "firebase/firestore";

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
  billing_cycle?: "monthly" | "annual" | "one-time" | "hourly";
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

export interface AuthorizedUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "employee";
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
  authorizedUsers: AuthorizedUser[];
  syncStatus: "idle" | "syncing" | "synced" | "error";
  firebaseConfig: { apiKey: string; projectId: string; appId: string } | null;
  
  // Auth actions
  login: (email: string, role: "admin" | "employee", customName?: string, customCompanyName?: string) => boolean;
  logout: () => void;
  addAuthorizedUser: (email: string, fullName: string, role: "admin" | "employee") => AuthorizedUser;
  updateAuthorizedUser: (id: string, updates: Partial<AuthorizedUser>) => void;
  deleteAuthorizedUser: (id: string) => void;
  
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
  saveFirebaseConfig: (apiKey: string, projectId: string, appId: string) => Promise<boolean>;
  disconnectFirebase: () => void;
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
    name: "Hadyra Technology",
    gstin: "33AADCH3984M1Z2",
    phone: "+91 98765 43210",
    email: "billing@hadyratech.com",
    address: "Hadyra Technologies, Chennai, Tamilnadu, India",
    currency: "INR",
    invoice_prefix: "HT-INV",
    invoice_counter: 104,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    logo_url: "",
    signature_url: ""
  },
  {
    id: "bus-2",
    name: "Hadyra Technology (Qatar Branch)",
    gstin: "CR-984210",
    phone: "+974 4455 6677",
    email: "qatar@hadyratech.com",
    address: "Hadyra Technologies, Doha, Qatar",
    currency: "QAR",
    invoice_prefix: "HTQ-INV",
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
    name: "Custom Software Development (Hourly)",
    sku: "HT-DEV-HR",
    barcode: "8901234567012",
    description: "Expert software engineering, architecture, and coding services billed per hour.",
    purchase_price: 0.00,
    sales_price: 2500.00,
    tax_rate: 18.00,
    stock_quantity: 1250,
    min_stock_alert: 100,
    category: "Software Services",
    billing_cycle: "hourly",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-2",
    business_id: "bus-1",
    name: "Cloud Infrastructure Migration",
    sku: "HT-CLD-MIG",
    barcode: "8901234567029",
    description: "End-to-end migration of legacy infrastructure to secure cloud systems (AWS/GCP/Azure).",
    purchase_price: 5000.00,
    sales_price: 45000.00,
    tax_rate: 12.00,
    stock_quantity: 8,
    min_stock_alert: 10,
    category: "Cloud Services",
    billing_cycle: "one-time",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-3",
    business_id: "bus-1",
    name: "Annual Maintenance Contract (AMC)",
    sku: "HT-AMC-ANN",
    barcode: "8901234567036",
    description: "Comprehensive annual maintenance, support retainers, and SLA management.",
    purchase_price: 0.00,
    sales_price: 75000.00,
    tax_rate: 18.00,
    stock_quantity: 340,
    min_stock_alert: 50,
    category: "Support Contracts",
    billing_cycle: "annual",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prod-4",
    business_id: "bus-1",
    name: "Hadyra Enterprise SaaS License",
    sku: "HT-SAAS-ENT",
    barcode: "HT-SAAS-ENT",
    description: "1-year subscription license for Hadyra Cloud Suite ERP.",
    purchase_price: 12000.00,
    sales_price: 150000.00,
    tax_rate: 18.00,
    stock_quantity: 9999, // Infinite digital goods
    min_stock_alert: 2,
    category: "Software Licensing",
    billing_cycle: "annual",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Business 2 products (Qatar Branch)
  {
    id: "prod-5",
    business_id: "bus-2",
    name: "ERP Cloud Subscription (Premium)",
    sku: "HTQ-ERP-PREM",
    barcode: "8901058002345",
    description: "Premium ERP subscription license with multi-currency billing support.",
    purchase_price: 1000.00,
    sales_price: 3500.00,
    tax_rate: 0.00,
    stock_quantity: 120,
    min_stock_alert: 15,
    category: "Software Licensing",
    billing_cycle: "monthly",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-6",
    business_id: "bus-2",
    name: "Dedicated IT Support Retainer (Monthly)",
    sku: "HTQ-IT-RET",
    barcode: "8901058004561",
    description: "24/7 dedicated system admin and database support service retainer.",
    purchase_price: 1200.00,
    sales_price: 5000.00,
    tax_rate: 0.00,
    stock_quantity: 50,
    min_stock_alert: 10,
    category: "Managed IT Services",
    billing_cycle: "monthly",
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
    name: "Custom Software Development (Hourly)",
    quantity: 3,
    price: 2500.00,
    tax_rate: 18.00,
    tax_amount: 1350.00,
    discount: 500.00,
    total: 8350.00
  },
  {
    id: "item-2",
    invoice_id: "inv-1",
    product_id: "prod-4",
    name: "Hadyra Enterprise SaaS License",
    quantity: 1,
    price: 2500.00,
    tax_rate: 18.00,
    tax_amount: 450.00,
    discount: 0.00,
    total: 2950.00
  },
  {
    id: "item-3",
    invoice_id: "inv-2",
    product_id: "prod-2",
    name: "Cloud Infrastructure Migration",
    quantity: 1,
    price: 4250.00,
    tax_rate: 12.00,
    tax_amount: 725.00,
    discount: 250.00,
    total: 4725.00
  },
  {
    id: "item-4",
    invoice_id: "inv-3",
    product_id: "prod-1",
    name: "Custom Software Development (Hourly)",
    quantity: 2,
    price: 2500.00,
    tax_rate: 16.00,
    tax_amount: 800.00,
    discount: 0.00,
    total: 5800.00
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
    details: "Added new product: Cloud Infrastructure Migration",
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

const MOCK_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: "auth-1",
    email: "admin@hadyratech.com",
    full_name: "Saaqib",
    role: "admin",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "auth-2",
    email: "sales@hadyratech.com",
    full_name: "Vikram Mehta",
    role: "employee",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to wrap promises with a timeout to prevent hanging on network/database issues
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage = "Operation timed out"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

export const DbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State variables
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [firebaseConfig, setFirebaseConfig] = useState<{ apiKey: string; projectId: string; appId: string } | null>(null);
  const [firebaseDb, setFirebaseDb] = useState<any>(null);

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
    const storedFirebase = localStorage.getItem("hadyra_firebase_config");
    const storedAuthorizedUsers = localStorage.getItem("hadyra_authorized_users");

    if (storedFirebase) {
      try {
        const parsed = JSON.parse(storedFirebase);
        setFirebaseConfig(parsed);
        const config = {
          apiKey: parsed.apiKey,
          authDomain: `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId,
          storageBucket: `${parsed.projectId}.appspot.com`,
          messagingSenderId: "",
          appId: parsed.appId
        };
        let app;
        if (getApps().length === 0) {
          app = initializeApp(config);
        } else {
          app = getApp();
        }
        const dbInstance = getFirestore(app);
        setFirebaseDb(dbInstance);

        // Fetch authorized users asynchronously from cloud
        const fetchAuth = async () => {
          try {
            const colRef = collection(dbInstance, "authorized_users");
            const snap = await withTimeout(getDocs(colRef), 3000, "Fetch authorized users timed out");
            const list: AuthorizedUser[] = [];
            snap.forEach((docRef) => {
              list.push(docRef.data() as AuthorizedUser);
            });
            if (list.length > 0) {
              setAuthorizedUsers(list);
              localStorage.setItem("hadyra_authorized_users", JSON.stringify(list));
            }
          } catch (e) {
            console.error("Failed to fetch authorized users", e);
          }
        };
        fetchAuth();
      } catch (e) {
        console.error("Error loading Firebase config", e);
      }
    }

    // Set user
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
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
    if (storedAuthorizedUsers) {
      try { setAuthorizedUsers(JSON.parse(storedAuthorizedUsers)); } catch (e) { setAuthorizedUsers(MOCK_AUTHORIZED_USERS); }
    } else {
      setAuthorizedUsers(MOCK_AUTHORIZED_USERS);
    }
  }, []);

  function seedMockData() {
    setBusinesses(MOCK_BUSINESSES);
    setActiveBusiness(MOCK_BUSINESSES[0]);
    setProducts(MOCK_PRODUCTS);
    setCustomers(MOCK_CUSTOMERS);
    setInvoices(MOCK_INVOICES);
    setExpenses(MOCK_EXPENSES);
    setLogs(MOCK_AUDIT_LOGS);
    setAuthorizedUsers(MOCK_AUTHORIZED_USERS);

    localStorage.setItem("hadyra_businesses", JSON.stringify(MOCK_BUSINESSES));
    localStorage.setItem("hadyra_active_business_id", MOCK_BUSINESSES[0].id);
    localStorage.setItem("hadyra_products", JSON.stringify(MOCK_PRODUCTS));
    localStorage.setItem("hadyra_customers", JSON.stringify(MOCK_CUSTOMERS));
    localStorage.setItem("hadyra_invoices", JSON.stringify(MOCK_INVOICES));
    localStorage.setItem("hadyra_expenses", JSON.stringify(MOCK_EXPENSES));
    localStorage.setItem("hadyra_logs", JSON.stringify(MOCK_AUDIT_LOGS));
    localStorage.setItem("hadyra_authorized_users", JSON.stringify(MOCK_AUTHORIZED_USERS));
  }

  // Syncer helper to write local states to browser cache
  const saveLocal = (key: string, data: any) => {
    localStorage.setItem(`hadyra_${key}`, JSON.stringify(data));
  };

  // Firestore helper write function
  const writeToFirestore = async (collectionName: string, docId: string, data: any, deleteOp = false) => {
    if (!firebaseDb) return;
    try {
      const docRef = doc(firebaseDb, collectionName, docId);
      if (deleteOp) {
        await withTimeout(deleteDoc(docRef), 5000, `Delete doc ${docId} from ${collectionName} timed out`);
      } else {
        await withTimeout(setDoc(docRef, data, { merge: true }), 5000, `Set doc ${docId} in ${collectionName} timed out`);
      }
    } catch (err) {
      console.error(`Error writing to Firestore collection ${collectionName}:`, err);
    }
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

    // If Firebase is active, async push log
    if (firebaseDb) {
      writeToFirestore("audit_logs", newLog.id, newLog);
    }
  };

  // Auth Operations
  const login = (
    email: string,
    role: "admin" | "employee",
    customName?: string,
    customCompanyName?: string
  ): boolean => {
    // Check if user is authorized in authorizedUsers list
    const matchedUser = authorizedUsers.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

    let resolvedRole = role;
    let resolvedName = customName || (role === "admin" ? "Saaqib" : "Vikram Mehta");
    let businessId = activeBusiness?.id || "bus-1";

    if (customCompanyName) {
      // Create new business (Registration flow)
      const newBiz: Business = {
        id: `bus-${Date.now()}`,
        name: customCompanyName,
        currency: "INR",
        invoice_prefix: customCompanyName.split(" ").map(w => w[0]).join("").toUpperCase() + "-INV",
        invoice_counter: 1,
        created_at: new Date().toISOString(),
        logo_url: "",
        signature_url: ""
      };
      
      // Update businesses list
      const updatedBizs = [...businesses, newBiz];
      setBusinesses(updatedBizs);
      saveLocal("businesses", updatedBizs);
      
      // Set as active business
      setActiveBusiness(newBiz);
      localStorage.setItem("hadyra_active_business_id", newBiz.id);
      
      businessId = newBiz.id;
      
      // Log business creation
      setTimeout(() => {
        addLogLocal("BUSINESS_CREATE", `Created new business: ${customCompanyName}`);
      }, 50);

      if (firebaseDb) {
        writeToFirestore("businesses", newBiz.id, newBiz);
      }

      // Automatically authorize the registering user as admin
      const newAuthUser: AuthorizedUser = {
        id: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email.trim().toLowerCase(),
        full_name: resolvedName.trim(),
        role: "admin",
        created_at: new Date().toISOString()
      };
      const updatedAuthUsers = [...authorizedUsers, newAuthUser];
      setAuthorizedUsers(updatedAuthUsers);
      saveLocal("authorized_users", updatedAuthUsers);
      if (firebaseDb) {
        writeToFirestore("authorized_users", newAuthUser.id, newAuthUser);
      }
      
      resolvedRole = "admin";
    } else {
      // Login flow: must exist in authorizedUsers
      if (!matchedUser) {
        return false;
      }
      resolvedRole = matchedUser.role;
      resolvedName = matchedUser.full_name;
    }

    const loggedUser: Profile = {
      id: matchedUser ? matchedUser.id : (resolvedRole === "admin" ? "user-1" : "user-2"),
      email,
      full_name: resolvedName,
      role: resolvedRole,
      active_business_id: businessId
    };
    setCurrentUser(loggedUser);
    localStorage.setItem("hadyra_user", JSON.stringify(loggedUser));
    
    // Add log
    setTimeout(() => {
      addLogLocal("USER_LOGIN", `User ${resolvedName} logged in successfully with role: ${resolvedRole}`);
    }, 100);
    return true;
  };

  const logout = () => {
    addLogLocal("USER_LOGOUT", `User logged out`);
    setCurrentUser(null);
    localStorage.removeItem("hadyra_user");
  };

  const addAuthorizedUser = (
    email: string,
    fullName: string,
    role: "admin" | "employee"
  ): AuthorizedUser => {
    const newUser: AuthorizedUser = {
      id: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role,
      created_at: new Date().toISOString()
    };
    
    const updated = [...authorizedUsers, newUser];
    setAuthorizedUsers(updated);
    saveLocal("authorized_users", updated);
    
    addLogLocal("AUTH_USER_ADD", `Granted access to ${fullName} (${email}) as ${role}`);
    
    if (firebaseDb) {
      writeToFirestore("authorized_users", newUser.id, newUser);
    }
    
    return newUser;
  };

  const updateAuthorizedUser = (id: string, updates: Partial<AuthorizedUser>) => {
    const updated = authorizedUsers.map((user) => {
      if (user.id === id) {
        const updatedUser = { ...user, ...updates };
        if (firebaseDb) {
          writeToFirestore("authorized_users", id, updatedUser);
        }
        return updatedUser;
      }
      return user;
    });
    
    setAuthorizedUsers(updated);
    saveLocal("authorized_users", updated);
    addLogLocal("AUTH_USER_UPDATE", `Updated permissions for user ID: ${id}`);
  };

  const deleteAuthorizedUser = (id: string) => {
    const userToDelete = authorizedUsers.find(u => u.id === id);
    const updated = authorizedUsers.filter((user) => user.id !== id);
    
    setAuthorizedUsers(updated);
    saveLocal("authorized_users", updated);
    
    if (userToDelete) {
      addLogLocal("AUTH_USER_REVOKE", `Revoked access for ${userToDelete.full_name} (${userToDelete.email})`);
    }
    
    if (firebaseDb) {
      writeToFirestore("authorized_users", id, null, true);
    }
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

    if (firebaseDb) {
      writeToFirestore("businesses", newBiz.id, newBiz);
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

    if (firebaseDb) {
      writeToFirestore("businesses", id, updates);
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

    if (firebaseDb) {
      writeToFirestore("products", newProd.id, newProd);
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

    if (firebaseDb) {
      writeToFirestore("products", id, updates);
    }
  };

  const deleteProduct = (id: string) => {
    const match = products.find(p => p.id === id);
    const filtered = products.filter((p) => p.id !== id);
    setProducts(filtered);
    saveLocal("products", filtered);

    addLogLocal("PRODUCT_DELETE", `Removed item: ${match?.name || id}`);

    if (firebaseDb) {
      writeToFirestore("products", id, null, true);
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

    if (firebaseDb) {
      writeToFirestore("customers", newCust.id, newCust);
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

    if (firebaseDb) {
      writeToFirestore("customers", id, updates);
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

    if (firebaseDb) {
      const match = customers.find(c => c.id === id);
      if (match) {
        writeToFirestore("customers", id, { balance: Math.max(0, match.balance + amount) });
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

      if (firebaseDb) {
        const target = customers.find(c => c.id === invData.customer_id);
        if (target) {
          writeToFirestore("customers", target.id, {
            balance: target.balance + balanceOwed,
            loyalty_points: target.loyalty_points + Math.floor(invData.total_amount / 100)
          });
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

    // Sync to Firebase if connected
    if (firebaseDb) {
      // 1. Insert Invoice
      writeToFirestore("invoices", newInvoice.id, newInvoice);
      // 2. Update stock levels on Firebase
      itemsData.forEach((item) => {
        if (item.product_id) {
          const match = products.find(p => p.id === item.product_id);
          if (match) {
            writeToFirestore("products", item.product_id, {
              stock_quantity: Math.max(0, match.stock_quantity - item.quantity)
            });
          }
        }
      });
      // 3. Update Business Counter on Firebase
      writeToFirestore("businesses", activeBusiness.id, {
        invoice_counter: activeBusiness.invoice_counter + 1
      });
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

    if (firebaseDb) {
      writeToFirestore("invoices", id, null, true);
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

    if (firebaseDb) {
      writeToFirestore("expenses", newExp.id, newExp);
    }
    return newExp;
  };

  const deleteExpense = (id: string) => {
    const match = expenses.find((e) => e.id === id);
    const filtered = expenses.filter((e) => e.id !== id);
    setExpenses(filtered);
    saveLocal("expenses", filtered);

    addLogLocal("EXPENSE_DELETE", `Removed Expense of ₹${match?.amount || id}`);

    if (firebaseDb) {
      writeToFirestore("expenses", id, null, true);
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

  // Firebase Custom Config
  const saveFirebaseConfig = async (apiKey: string, projectId: string, appId: string): Promise<boolean> => {
    try {
      setSyncStatus("syncing");
      const config = {
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: "",
        appId
      };
      
      let app;
      if (getApps().length === 0) {
        app = initializeApp(config);
      } else {
        try {
          const existingApp = getApp();
          await deleteApp(existingApp);
        } catch (err) {}
        app = initializeApp(config);
      }
      
      const db = getFirestore(app);
      
      // Test the Firestore connection by doing a getDocs from businesses collection
      const testRef = collection(db, "businesses");
      await withTimeout(getDocs(testRef), 5000, "Connection timed out. Please check your Firestore setup, rules, or internet connection.");

      // Sync authorized users from/to Firestore on connection
      try {
        const colRef = collection(db, "authorized_users");
        const snap = await withTimeout(getDocs(colRef), 5000, "Fetch authorized users timed out");
        const list: AuthorizedUser[] = [];
        snap.forEach((docRef) => {
          list.push(docRef.data() as AuthorizedUser);
        });
        if (list.length > 0) {
          setAuthorizedUsers(list);
          localStorage.setItem("hadyra_authorized_users", JSON.stringify(list));
        } else {
          // Sync existing local authorized users to Firestore
          const batch = writeBatch(db);
          const currentList = localStorage.getItem("hadyra_authorized_users") 
            ? JSON.parse(localStorage.getItem("hadyra_authorized_users")!) 
            : MOCK_AUTHORIZED_USERS;
          
          for (const user of currentList) {
            const uRef = doc(db, "authorized_users", user.id);
            batch.set(uRef, user);
          }
          await withTimeout(batch.commit(), 5000, "Initializing authorized users in Firestore timed out");
        }
      } catch (err) {
        console.error("Failed to sync authorized users on connection:", err);
      }

      setFirebaseConfig({ apiKey, projectId, appId });
      setFirebaseDb(db);
      localStorage.setItem("hadyra_firebase_config", JSON.stringify({ apiKey, projectId, appId }));
      setSyncStatus("synced");
      addLogLocal("CLOUD_CONNECT", `Connected to cloud database (Firestore): ${projectId}`);
      return true;
    } catch (e: any) {
      setSyncStatus("error");
      addLogLocal("CLOUD_CONNECT_FAIL", `Firestore registration failed: ${e.message}`);
      return false;
    }
  };

  const disconnectFirebase = () => {
    setFirebaseConfig(null);
    setFirebaseDb(null);
    localStorage.removeItem("hadyra_firebase_config");
    setSyncStatus("idle");
    addLogLocal("CLOUD_DISCONNECT", "Cloud database synchronization disconnected.");
  };

  // Bulk Sync to Cloud (Firestore)
  const syncToCloud = async () => {
    if (!firebaseDb) {
      setSyncStatus("error");
      return;
    }

    try {
      setSyncStatus("syncing");

      // Helper to batch set items in Firestore using chunks of 400
      const commitBatchInChunks = async (collectionName: string, itemsList: any[]) => {
        let currentBatch = writeBatch(firebaseDb);
        let count = 0;
        
        for (const item of itemsList) {
          const docRef = doc(firebaseDb, collectionName, item.id);
          currentBatch.set(docRef, item, { merge: true });
          count++;
          
          if (count === 400) {
            await withTimeout(currentBatch.commit(), 5000, `Syncing ${collectionName} timed out`);
            currentBatch = writeBatch(firebaseDb);
            count = 0;
          }
        }
        
        if (count > 0) {
          await withTimeout(currentBatch.commit(), 5000, `Syncing ${collectionName} timed out`);
        }
      };
      
      // Upload businesses
      if (businesses.length > 0) {
        await commitBatchInChunks("businesses", businesses);
      }

      // Upload products
      if (products.length > 0) {
        await commitBatchInChunks("products", products);
      }

      // Upload customers
      if (customers.length > 0) {
        await commitBatchInChunks("customers", customers);
      }

      // Upload invoices (with nested items)
      if (invoices.length > 0) {
        await commitBatchInChunks("invoices", invoices);
      }

      // Upload expenses
      if (expenses.length > 0) {
        await commitBatchInChunks("expenses", expenses);
      }

      // Upload logs
      if (logs.length > 0) {
        await commitBatchInChunks("audit_logs", logs);
      }

      // Upload authorized users
      if (authorizedUsers.length > 0) {
        await commitBatchInChunks("authorized_users", authorizedUsers);
      }

      setSyncStatus("synced");
      addLogLocal("CLOUD_SYNC", "Manual sync completed. All offline records pushed to Firestore.");
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
        authorizedUsers,
        syncStatus,
        firebaseConfig,
        login,
        logout,
        addAuthorizedUser,
        updateAuthorizedUser,
        deleteAuthorizedUser,
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
        saveFirebaseConfig,
        disconnectFirebase,
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
