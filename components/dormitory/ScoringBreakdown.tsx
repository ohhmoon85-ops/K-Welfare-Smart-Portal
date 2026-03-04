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
  high:   { label: "우선순위 높음", color: "success" as const,   bar: "bg-emerald-500" },
  medium: { label: "우선순위 중간", color: "warning" as const,   bar: "bg-amber-500" },
  low:    { label: "우선순위 낮음", color: "secondary" as const, bar: "bg-slate-300" },
};

export default function ScoringBreakdown({ student, compact = false }: Props) {
  const tier = scoreTier(student.scores.total);
  const cfg = tierConfig[tier];

  const items = [
    {
      label: "재학중인 학교",
      score: student.scores.schoolScore,
      max: 40,
      color: "bg-blue-500",
      sub: student.schoolLevel,
    },
    {
      label: "부(모) 복무기간",
      score: student.scores.serviceScore,
      max: 40,
      color: "bg-emerald-500",
      sub: `${student.serviceYears}년`,
    },
    {
      label: "시외 학생 주소지",
      score: student.scores.studentDistScore,
      max: 10,
      color: "bg-amber-500",
      sub: student.isStudentInCity ? "시내 거주 (0점)" : `${student.studentDistanceKm}km`,
    },
    {
      label: "시외 부모 근무지역",
      score: student.scores.parentDistScore,
      max: 10,
      color: "bg-orange-500",
      sub: student.isParentInCity ? "시내 근무 (0점)" : `${student.parentDistanceKm}km`,
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

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">
                {item.label}
                <span className="ml-1 text-slate-400">({item.sub})</span>
              </span>
              <span className="font-semibold">
                {item.score}
                <span className="text-slate-400 font-normal">/{item.max}</span>
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", item.color)}
                style={{ width: `${Math.round((item.score / item.max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {student.scores.bonusScore > 0 && (
        <div className="bg-purple-50 rounded px-3 py-1.5 flex justify-between text-xs">
          <span className="text-purple-700">
            가점
            {student.isMultiChild    ? " · 세자녀이상" : ""}
            {student.isMulticultural ? " · 다문화"     : ""}
            {student.isSingleParent  ? " · 한부모"     : ""}
          </span>
          <span className="font-semibold text-purple-700">+{student.scores.bonusScore}점</span>
        </div>
      )}

      <div className="rounded-lg px-3 py-2 flex justify-between items-center bg-slate-100 border border-slate-200">
        <span className="text-sm font-semibold">총점</span>
        <span className="text-xl font-bold text-blue-700">
          {student.scores.total}
          <span className="text-sm text-slate-500 font-normal">/101</span>
        </span>
      </div>
    </div>
  );
}
