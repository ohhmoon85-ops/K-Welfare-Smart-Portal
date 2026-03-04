"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcVendorTotal } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Calculator } from "lucide-react";

export default function VendorForm() {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    name: "",
    item: "",
    priceScore: "",
    technicalScore: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const price = parseFloat(form.priceScore) || 0;
  const tech = parseFloat(form.technicalScore) || 0;
  const preview = (price > 0 || tech > 0) ? calcVendorTotal(price, tech) : null;

  const isValid = form.name && form.item &&
    price >= 0 && price <= 100 && tech >= 0 && tech <= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    dispatch({
      type: "ADD_VENDOR",
      vendor: { name: form.name, item: form.item, priceScore: price, technicalScore: tech },
    });
    setForm({ name: "", item: "", priceScore: "", technicalScore: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="w-4 h-4 text-blue-500" />
          입찰 업체 등록
        </CardTitle>
        <CardDescription>가격 점수(70%) + 기술 점수(30%) 기준으로 자동 순위 산정</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>업체명 *</Label>
              <Input placeholder="(주)한국군수산업" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>입찰 품목 *</Label>
              <Input placeholder="전투식량 3개월분" value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              평가 점수 입력 (0–100점)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  가격 점수
                  <span className="ml-1 text-slate-400">가중치 70%</span>
                </Label>
                <Input type="number" min="0" max="100" placeholder="0–100" value={form.priceScore}
                  onChange={(e) => setForm({ ...form, priceScore: e.target.value })} />
                {price > 0 && (
                  <p className="text-[10px] text-amber-600">반영 점수: {(price * 0.7).toFixed(1)}점</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  기술 점수
                  <span className="ml-1 text-slate-400">가중치 30%</span>
                </Label>
                <Input type="number" min="0" max="100" placeholder="0–100" value={form.technicalScore}
                  onChange={(e) => setForm({ ...form, technicalScore: e.target.value })} />
                {tech > 0 && (
                  <p className="text-[10px] text-blue-600">반영 점수: {(tech * 0.3).toFixed(1)}점</p>
                )}
              </div>
            </div>
          </div>

          {preview !== null && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-3 text-white">
              <p className="text-xs opacity-80">종합 평가 점수 (가중 합산)</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold">{preview}</span>
                <span className="text-sm opacity-80 mb-0.5">/ 100점</span>
              </div>
              <p className="text-[10px] opacity-70 mt-1">
                {price} × 0.7 + {tech} × 0.3 = {preview}
              </p>
            </div>
          )}

          {submitted && (
            <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200">
              ✓ 업체가 등록되어 순위가 자동 갱신되었습니다.
            </div>
          )}

          <Button type="submit" disabled={!isValid} className="w-full">
            업체 등록 및 순위 산정
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
