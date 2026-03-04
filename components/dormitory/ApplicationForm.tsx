"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcStudentScores } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Info } from "lucide-react";

const RANKS = ["이병", "일병", "상병", "병장", "하사", "중사", "상사", "원사", "준위", "소위", "중위", "대위", "소령", "중령", "대령", "준장", "소장", "중장", "대장"];

export default function ApplicationForm() {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    name: "",
    school: "",
    parentUnit: "",
    parentRank: "",
    distanceKm: "",
    siblings: "",
    relocationCount: "",
  });
  const [preview, setPreview] = useState<ReturnType<typeof calcStudentScores> | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);

    const dist = parseFloat(updated.distanceKm) || 0;
    const sib = parseInt(updated.siblings) || 0;
    const rel = parseInt(updated.relocationCount) || 0;
    if (dist > 0 || sib > 0 || rel > 0) {
      setPreview(calcStudentScores(dist, sib, rel));
    } else {
      setPreview(null);
    }
  };

  const isValid = form.name && form.school && form.parentUnit && form.parentRank &&
    parseFloat(form.distanceKm) >= 0 && parseInt(form.siblings) >= 0 && parseInt(form.relocationCount) >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    dispatch({
      type: "ADD_STUDENT",
      student: {
        name: form.name,
        school: form.school,
        parentUnit: form.parentUnit,
        parentRank: form.parentRank,
        distanceKm: parseFloat(form.distanceKm),
        siblings: parseInt(form.siblings),
        relocationCount: parseInt(form.relocationCount),
      },
    });
    setForm({ name: "", school: "", parentUnit: "", parentRank: "", distanceKm: "", siblings: "", relocationCount: "" });
    setPreview(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="w-4 h-4 text-blue-500" />
          기숙사 입사 신청서
        </CardTitle>
        <CardDescription>모든 필드를 입력하면 배점이 자동 계산됩니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">학생 이름 *</Label>
              <Input id="name" placeholder="홍길동" value={form.name}
                onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school">재학 학교 *</Label>
              <Input id="school" placeholder="육군사관학교" value={form.school}
                onChange={(e) => handleChange("school", e.target.value)} />
            </div>
          </div>

          {/* Parent Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="parentUnit">부모 소속 부대 *</Label>
              <Input id="parentUnit" placeholder="육군 1군단" value={form.parentUnit}
                onChange={(e) => handleChange("parentUnit", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentRank">부모 계급 *</Label>
              <Input id="parentRank" list="ranks" placeholder="중령" value={form.parentRank}
                onChange={(e) => handleChange("parentRank", e.target.value)} />
              <datalist id="ranks">
                {RANKS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
          </div>

          <Separator />

          {/* Scoring Inputs */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              배점 산정 기준 항목
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="distance" className="text-xs">
                  집↔학교 거리 (km)
                  <span className="ml-1 text-slate-400">× 1.5점</span>
                </Label>
                <Input id="distance" type="number" min="0" step="0.1" placeholder="0"
                  value={form.distanceKm} onChange={(e) => handleChange("distanceKm", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siblings" className="text-xs">
                  자녀 수 (형제 포함)
                  <span className="ml-1 text-slate-400">× 10점</span>
                </Label>
                <Input id="siblings" type="number" min="0" placeholder="0"
                  value={form.siblings} onChange={(e) => handleChange("siblings", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="relocation" className="text-xs">
                  부모 전근 횟수
                  <span className="ml-1 text-slate-400">× 5점</span>
                </Label>
                <Input id="relocation" type="number" min="0" placeholder="0"
                  value={form.relocationCount} onChange={(e) => handleChange("relocationCount", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Score Preview */}
          {preview && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                예상 점수 미리보기
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded p-2 border">
                  <p className="text-[10px] text-slate-500">거리 배점</p>
                  <p className="text-lg font-bold text-blue-600">{preview.distance}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="text-[10px] text-slate-500">다자녀 배점</p>
                  <p className="text-lg font-bold text-purple-600">{preview.multiChild}</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="text-[10px] text-slate-500">근무여건 배점</p>
                  <p className="text-lg font-bold text-amber-600">{preview.hardship}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded p-2">
                  <p className="text-[10px] text-blue-100">총점</p>
                  <p className="text-lg font-bold text-white">{preview.total}</p>
                </div>
              </div>
            </div>
          )}

          {submitted && (
            <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200">
              ✓ 신청서가 등록되었습니다. 점수 기반으로 자동 배정이 진행됩니다.
            </div>
          )}

          <Button type="submit" disabled={!isValid} className="w-full">
            신청서 제출
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
