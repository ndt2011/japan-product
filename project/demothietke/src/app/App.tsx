import React, { useState } from "react";
import { Layout, type Page } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Suppliers } from "./components/Suppliers";
import { Products } from "./components/Products";
import { StockIn } from "./components/StockIn";
import { StockOut } from "./components/StockOut";
import { Inventory } from "./components/Inventory";
import { Orders } from "./components/Orders";
import { Agents } from "./components/Agents";
import { Debts } from "./components/Debts";
import { Reports } from "./components/Reports";
import { AIProductCenter } from "./components/AIProductCenter";
import { Administration } from "./components/Administration";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const pageMap: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    suppliers: <Suppliers />,
    products: <Products />,
    "stock-in": <StockIn />,
    "stock-out": <StockOut />,
    inventory: <Inventory />,
    orders: <Orders />,
    agents: <Agents />,
    debts: <Debts />,
    reports: <Reports />,
    "ai-center": <AIProductCenter />,
    admin: <Administration />,
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {/* MARKER-MAKE-KIT-INVOKED */}
      {pageMap[currentPage]}
    </Layout>
  );
}
