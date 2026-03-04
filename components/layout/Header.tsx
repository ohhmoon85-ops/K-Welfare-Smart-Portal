"use client";
import { useApp } from "@/lib/store";
import { Bell, User, Shield } from "lucide-react";

const moduleNames: Record<string, string> = {
  dashboard: "대시보드",
  dormitory: "학생 기숙사 관리",
  procurement: "조달 · 입찰 관리",
  audit: "투명성 감사 · 부패방지 로그",
};

const moduleDesc: Record<string, string> = {
  dashboard: "전체 현황 요약 및 주요 지표",
  dormitory: "입사 신청, 점수 산정, 방 배정",
  procurement: "입찰 제안서 평가 및 업체 순위",
  audit: "모든 수동 조정 내역 및 점수 상세 내역",
};

export default function Header() {
  const { state } = useApp();
  const mod = state.activeModule;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{moduleNames[mod]}</h1>
        <p className="text-xs text-slate-500">{moduleDesc[mod]}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          <span>공정 시스템 운영 중</span>
        </div>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
