"use client";
import { useApp } from "@/lib/store";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import DormitoryModule from "@/components/dormitory/DormitoryModule";
import ProcurementModule from "@/components/procurement/ProcurementModule";
import AuditPage from "@/components/audit/AuditPage";

export default function Home() {
  const { state } = useApp();

  const renderContent = () => {
    switch (state.activeModule) {
      case "dashboard":
        return <Dashboard />;
      case "dormitory":
        return <DormitoryModule />;
      case "procurement":
        return <ProcurementModule />;
      case "audit":
        return <AuditPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
