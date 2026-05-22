"use client";

import React, { useState, useMemo } from "react";
import { useDb, Product } from "@/context/DbContext";
import { 
  Package, Search, Plus, Trash2, Edit2, AlertTriangle, 
  ArrowUp, ArrowDown, ChevronDown, Download, Upload, Barcode as BarcodeIcon, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Inventory() {
  const { 
    activeBusiness, products, addProduct, updateProduct, deleteProduct 
  } = useDb();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all"); // all, low, normal, out

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Barcode Preview Modal
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Packaging Materials");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salesPrice, setSalesPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(5);

  // Filter products by active business
  const businessProducts = useMemo(() => {
    return products.filter((p) => p.business_id === activeBusiness?.id);
  }, [products, activeBusiness]);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = new Set(businessProducts.map((p) => p.category));
    return Array.from(list);
  }, [businessProducts]);

  // Filter list results
  const filteredProducts = useMemo(() => {
    return businessProducts.filter((p) => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchQuery));
      
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      
      let matchStock = true;
      if (stockStatusFilter === "low") {
        matchStock = p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0;
      } else if (stockStatusFilter === "out") {
        matchStock = p.stock_quantity === 0;
      } else if (stockStatusFilter === "normal") {
        matchStock = p.stock_quantity > p.min_stock_alert;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [businessProducts, searchQuery, categoryFilter, stockStatusFilter]);

  // CSV Exports
  const handleExportCSV = () => {
    const headers = "Name,SKU,Barcode,Category,Purchase Price,Sales Price,Tax Rate,Stock Quantity,Min Stock Alert\n";
    const rows = businessProducts.map(p => 
      `"${p.name}","${p.sku || ""}","${p.barcode || ""}","${p.category}",${p.purchase_price},${p.sales_price},${p.tax_rate},${p.stock_quantity},${p.min_stock_alert}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HADYRA_INVENTORY_${activeBusiness?.name.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`); // Random standard barcode
    setDescription("");
    setCategory("Packaging Materials");
    setPurchasePrice(0);
    setSalesPrice(0);
    setTaxRate(18);
    setStockQuantity(10);
    setMinStockAlert(5);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku || "");
    setBarcode(product.barcode || "");
    setDescription(product.description || "");
    setCategory(product.category);
    setPurchasePrice(product.purchase_price);
    setSalesPrice(product.sales_price);
    setTaxRate(product.tax_rate);
    setStockQuantity(product.stock_quantity);
    setMinStockAlert(product.min_stock_alert);
    setShowProductModal(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name,
      sku: sku || name.split(" ").map(w => w[0]).join("").toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
      barcode,
      description,
      category,
      purchase_price: Number(purchasePrice),
      sales_price: Number(salesPrice),
      tax_rate: Number(taxRate),
      stock_quantity: Number(stockQuantity),
      min_stock_alert: Number(minStockAlert)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setShowProductModal(false);
  };

  // Adjust stock inline
  const handleStockAdj = (id: string, dir: "up" | "down") => {
    const target = products.find(p => p.id === id);
    if (target) {
      const delta = dir === "up" ? 1 : -1;
      updateProduct(id, { stock_quantity: Math.max(0, target.stock_quantity + delta) });
    }
  };

  // Barcode Line drawer helper
  const drawBarcodeLines = (val: string) => {
    // Return vertical line SVGs of varying thickness
    const elements = [];
    const seed = val || "123456789";
    let xOffset = 10;
    
    for (let i = 0; i < seed.length; i++) {
      const charCode = seed.charCodeAt(i);
      const width1 = (charCode % 3) + 1; // 1 to 3 width
      const width2 = ((charCode + 2) % 4) + 1; // Gap spacing
      
      elements.push(
        <rect key={`line-${i}`} x={xOffset} y="10" width={width1} height="80" fill="black" />,
        <rect key={`gap-${i}`} x={xOffset + width1} y="10" width={width2} height="80" fill="transparent" />
      );
      xOffset += width1 + width2;
    }
    return { elements, xOffset };
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">Inventory Stock Registry</h1>
          <p className="text-xs md:text-sm text-brand-gray">Create catalog products, track alert thresholds, and export lists.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-brand-blue/20"
          >
            <Plus className="w-4 h-4" />
            Add Catalog Item
          </button>
        </div>
      </div>

      {/* Search and filter toolbar */}
      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-3.5">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4.5 h-4.5 text-brand-gray absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Filter catalog by product name, SKU, or barcode code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>

        {/* Category select */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl glass-input appearance-none font-semibold text-slate-200 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-brand-gray absolute right-3 top-3.5 pointer-events-none" />
        </div>

        {/* Stock status filter */}
        <div className="relative">
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl glass-input appearance-none font-semibold text-slate-200 cursor-pointer"
          >
            <option value="all">Stock Levels: All</option>
            <option value="normal">Healthy Stock</option>
            <option value="low">Low Stock Alerts</option>
            <option value="out">Out of Stock</option>
          </select>
          <ChevronDown className="w-4 h-4 text-brand-gray absolute right-3 top-3.5 pointer-events-none" />
        </div>

      </div>

      {/* Inventory table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-brand-gray uppercase tracking-wider font-bold">
                <th className="p-4">Item Catalog Details</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Sales Price</th>
                <th className="p-4 text-center">GST %</th>
                <th className="p-4 text-center w-28">Stock Level</th>
                <th className="p-4 text-center">Action Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950 text-xs text-slate-350">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLow = p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-950/15 transition-all">
                      <td className="p-4 flex items-start gap-3">
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-brand-blue flex-shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 block text-xs md:text-sm">{p.name}</span>
                          <span className="text-[10px] text-brand-gray font-mono">SKU: {p.sku || "N/A"} • Barcode: {p.barcode || "N/A"}</span>
                          {p.description && <p className="text-[10px] text-brand-gray mt-1 truncate max-w-[240px]">{p.description}</p>}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">
                        {p.category}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        ₹{p.purchase_price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-250">
                        ₹{p.sales_price.toFixed(2)}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-400">
                        {p.tax_rate}%
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStockAdj(p.id, "down")}
                              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                            >
                              <ArrowDown className="w-3 h-3 text-slate-400" />
                            </button>
                            <span className={`font-mono font-bold text-sm w-8 text-center ${
                              isOut ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-400"
                            }`}>
                              {p.stock_quantity}
                            </span>
                            <button
                              onClick={() => handleStockAdj(p.id, "up")}
                              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                            >
                              <ArrowUp className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                          
                          {/* Alert indicators */}
                          {isOut ? (
                            <span className="text-[8px] uppercase tracking-wide bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[8px] uppercase tracking-wide bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setBarcodePreviewProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-brand-gray hover:text-white transition"
                            title="Barcode Generator"
                          >
                            <BarcodeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-brand-gray hover:text-[#0A6CFF] transition"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove product catalog item "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-brand-gray hover:text-rose-400 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-brand-gray">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                    No inventory catalog products found. Create some above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#0b1329] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">
                {editingProduct ? "Edit Inventory Product" : "Create Catalog Product"}
              </h3>

              <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Bubble Wrap rolls (50m)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* SKU and Barcode row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Product SKU Identifier</label>
                    <input
                      type="text"
                      placeholder="HT-BBL-50"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Barcode Code (EAN/UPC)</label>
                    <input
                      type="text"
                      placeholder="8901234567"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                </div>

                {/* Description and category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Description</label>
                    <input
                      type="text"
                      placeholder="High density fragile bubble rolls"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Product Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                    >
                      <option value="Packaging Materials">Packaging Materials</option>
                      <option value="Software Licensing">Software Licensing</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Retail Supplies">Retail Supplies</option>
                    </select>
                  </div>
                </div>

                {/* Prices & tax */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Sales Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">GST Rate (%)</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                    >
                      <option value="0">0% Exempt</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>
                </div>

                {/* Stock levels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Opening Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Min Stock Alert Level</label>
                    <input
                      type="number"
                      required
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 text-brand-gray font-semibold rounded-xl hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(10,108,255,0.3)]"
                  >
                    {editingProduct ? "Update Catalog Item" : "Create Catalog Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Barcode Visual Generator Preview Modal */}
      <AnimatePresence>
        {barcodePreviewProduct && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white text-black rounded-3xl p-6 shadow-2xl space-y-6 text-center"
            >
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="font-extrabold text-sm">{barcodePreviewProduct.name}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase font-display">SKU: {barcodePreviewProduct.sku}</span>
                </div>
                <button
                  onClick={() => setBarcodePreviewProduct(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-650 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic SVG Barcode Generator block */}
              <div className="py-4 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-slate-50">
                <div className="space-y-2">
                  <svg viewBox={`0 0 ${drawBarcodeLines(barcodePreviewProduct.barcode || "890").xOffset + 10} 100`} className="w-48 h-20 overflow-visible mx-auto">
                    {drawBarcodeLines(barcodePreviewProduct.barcode || "890").elements}
                  </svg>
                  <span className="text-xs font-mono tracking-[0.25em] font-semibold block">
                    {barcodePreviewProduct.barcode || barcodePreviewProduct.sku}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 text-white hover:bg-slate-950 text-xs font-semibold rounded-xl transition"
                >
                  Print Label
                </button>
                <button
                  onClick={() => setBarcodePreviewProduct(null)}
                  className="flex-1 py-2.5 border border-slate-350 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
