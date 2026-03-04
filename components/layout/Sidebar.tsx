"use client";
import { useApp } from "@/lib/store";
import type { ActiveModule } from "@/lib/types";
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  ShieldCheck,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { id: ActiveModule; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "dormitory", label: "학생 기숙사", icon: Building2 },
  { id: "procurement", label: "조달 · 입찰", icon: ShoppingCart },
  { id: "audit", label: "투명성 감사", icon: ShieldCheck },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">K-복지 스마트 포털</p>
            <p className="text-[10px] text-slate-400 leading-tight">지능형 통합 복지행정 자동화</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = state.activeModule === id;
          return (
            <button
              key={id}
              onClick={() => dispatch({ type: "SET_MODULE", module: id })}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-[10px] text-slate-500">© 2026 국군복지단</p>
        <p className="text-[10px] text-slate-600">ver 1.0.0</p>
      </div>
    </aside>
  );
}
