"use client";

import React, { useState } from "react";
import { DbProvider, useDb } from "@/context/DbContext";
import Auth from "@/components/Auth";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import Billing from "@/components/Billing";
import InvoicesList from "@/components/InvoicesList";
import Inventory from "@/components/Inventory";
import Customers from "@/components/Customers";
import Expenses from "@/components/Expenses";
import Reports from "@/components/Reports";
import Settings from "@/components/Settings";
import PrintInvoice from "@/components/PrintInvoice";
import ShareInvoiceModal from "@/components/ShareInvoiceModal";

function AppContent() {
  const { currentUser } = useDb();
  const [activeView, setActiveView] = useState("dashboard");
  
  // Printing & Sharing modal triggers
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);
  const [shareInvoiceId, setShareInvoiceId] = useState<string | null>(null);

  if (!currentUser) {
    return <Auth />;
  }

  // Dynamic View Switcher
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "billing":
        return (
          <Billing 
            onPrintInvoice={(id) => setPrintInvoiceId(id)} 
            onShareInvoice={(id) => setShareInvoiceId(id)} 
          />
        );
      case "invoices":
        return (
          <InvoicesList 
            onPrintInvoice={(id) => setPrintInvoiceId(id)} 
            onShareInvoice={(id) => setShareInvoiceId(id)} 
          />
        );
      case "inventory":
        return <Inventory />;
      case "customers":
        return <Customers />;
      case "expenses":
        return <Expenses />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {printInvoiceId ? (
        <PrintInvoice 
          invoiceId={printInvoiceId} 
          onClose={() => setPrintInvoiceId(null)} 
        />
      ) : (
        <Layout activeView={activeView} setActiveView={setActiveView}>
          {renderView()}
        </Layout>
      )}

      {/* Share Invoice Modal overlay */}
      {shareInvoiceId && (
        <ShareInvoiceModal 
          invoiceId={shareInvoiceId} 
          onClose={() => setShareInvoiceId(null)} 
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
}
