"use client";
import type { Student } from "@/lib/types";
import { scoreTier } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  student: Student;
  compact?: boolean;
}

const tierConfig = {
  high: { label: "우선순위 높음", color: "success" as const, bar: "bg-emerald-500" },
  medium: { label: "우선순위 중간", color: "warning" as const, bar: "bg-amber-500" },
  low: { label: "우선순위 낮음", color: "secondary" as const, bar: "bg-slate-300" },
};

export default function ScoringBreakdown({ student, compact = false }: Props) {
  const tier = scoreTier(student.scores.total);
  const cfg = tierConfig[tier];
  const maxScore = 300; // reasonable max for display

  const items = [
    {
      label: "거리 배점",
      formula: `${student.distanceKm} km × 1.5`,
      score: student.scores.distance,
      color: "bg-blue-500",
      description: "집↔학교 직선거리 기준",
    },
    {
      label: "다자녀 배점",
      formula: `${student.siblings}명 × 10점`,
      score: student.scores.multiChild,
      color: "bg-purple-500",
      description: "가정 내 자녀 수 기준",
    },
    {
      label: "근무여건 배점",
      formula: `${student.relocationCount}회 × 5점`,
      score: student.scores.hardship,
      color: "bg-amber-500",
      description: "부모 전근·이동 횟수 기준",
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-600 text-sm">{student.scores.total}점</span>
        <Badge variant={cfg.color} className="text-[10px] py-0">{cfg.label}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          점수 산정 내역
        </span>
        <Badge variant={cfg.color}>{cfg.label}</Badge>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">
                {item.label}
                <span className="ml-1 text-slate-400">({item.formula})</span>
              </span>
              <span className="font-semibold">{item.score}점</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", item.color)}
                style={{ width: `${Math.min(100, (item.score / maxScore) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={cn("rounded-lg px-3 py-2 flex justify-between items-center", cfg.bar, "bg-opacity-10 border border-opacity-20")}>
        <span className="text-sm font-semibold">총점</span>
        <span className="text-xl font-bold text-blue-700">{student.scores.total}점</span>
      </div>
    </div>
  );
}
