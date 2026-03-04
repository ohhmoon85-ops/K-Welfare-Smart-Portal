"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcVendorTotal, QUALIFICATION_THRESHOLD } from "@/lib/scoring";
import type { VendorType, VendorSaleType, DocMap } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import FileUpload, { type RequiredDoc } from "@/components/ui/file-upload";
import { Calculator, Plus, Paperclip, CheckCircle2, XCircle, Globe, ShoppingBag } from "lucide-react";

// ─── PX/BX 구비서류 ─────────────────────────────────────────────────────────
const PX_DOCS: RequiredDoc[] = [
  { key: "application",      label: "① 입찰참가신청서",              description: "기관 양식 / 직인 필수",                     accept: ".pdf,.hwp,.doc,.docx" },
  { key: "business_reg",     label: "② 사업자등록증",                description: "사본 가능 / 최신본",                        accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "pos_receipt",      label: "③ POS 영수증 (최근 3개년)",     description: "판매 실적 확인용",                          accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls" },
  { key: "subcategory_cert", label: "④ 소분류확인서 (판매과 발급)",  description: "해당 소분류 거래 확인",                      accept: ".pdf,.hwp,.doc,.docx" },
  { key: "type_docs",        label: "⑤ 신청유형별 관련서류",         description: "일반/경쟁과열 유형에 따른 추가 서류",        accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
];

// ─── WA-mall 구비서류 ────────────────────────────────────────────────────────
const WA_DOCS: RequiredDoc[] = [
  { key: "wa_application", label: "① 신청서 (별지 #1)",            description: "국군복지단 선정관리시스템 출력본",            accept: ".pdf,.hwp,.doc,.docx" },
  { key: "product_image",  label: "② 물품 대표 이미지",            description: "정면·측면·후면 3종 이상",                    accept: ".jpg,.jpeg,.png" },
  { key: "distribution",   label: "③ 유통 증빙 자료",              description: "시중 종합몰 2개소 이상 판매 스크린샷",        accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "business_cert",  label: "④ 사업자등록증명원",            description: "최근 3개월 이내 발급",                       accept: ".pdf,.jpg,.png" },
  { key: "test_report",    label: "⑤ 시험성적서 / 품목제조보고서", description: "해당 품목 기준 (식품 등 필수)",               accept: ".pdf,.jpg,.png" },
];

// ─── WA-mall 대분류 카테고리 ─────────────────────────────────────────────────
const WA_CATEGORIES = [
  "화장품", "패션잡화", "패션의류", "스포츠/레저", "유아동",
  "가전/디지털/컴퓨터", "가구/침구", "주방/생활/건강", "식품", "애완/취미/자동차용품",
];

export default function VendorForm() {
  const { dispatch } = useApp();
  const [channel, setChannel] = useState<"PX/BX" | "WA-mall">("PX/BX");
  const [activeTab, setActiveTab] = useState<"info" | "docs">("info");
  const [submitted, setSubmitted] = useState(false);
  const [documents, setDocuments] = useState<DocMap>({});

  // ── PX/BX form ──
  const [px, setPx] = useState({
    name: "",
    subCategory: "",
    vendorType: "일반" as VendorType,
    qualificationScore: "",
    discountRate: "",
  });

  // ── WA-mall form ──
  const [wa, setWa] = useState({
    name: "",
    businessRegNumber: "",
    productCategory: "",
    subCategory: "",
    vendorSaleType: "직접제조판매" as VendorSaleType,
    requestedPrice: "",
    marketLowestPrice: "",
  });

  // ── Derived ──
  const isPx = channel === "PX/BX";
  const qualification = parseFloat(px.qualificationScore) || 0;
  const discount = parseFloat(px.discountRate) || 0;
  const passed = qualification >= QUALIFICATION_THRESHOLD;
  const preview = qualification > 0 ? calcVendorTotal(qualification, discount) : null;

  const waReqPrice = parseFloat(wa.requestedPrice) || 0;
  const waMarketPrice = parseFloat(wa.marketLowestPrice) || 0;
  const waDiscountOk = waMarketPrice > 0 && waReqPrice <= waMarketPrice * 0.9;
  const waDiscountPct = waMarketPrice > 0 ? Math.round((1 - waReqPrice / waMarketPrice) * 1000) / 10 : 0;

  const requiredDocs = isPx ? PX_DOCS : WA_DOCS;
  const uploadedDocCount = Object.values(documents).filter((arr) => (arr as unknown[]).length > 0).length;

  const isPxValid = !!px.name && !!px.subCategory && qualification >= 0 && qualification <= 100 && discount >= 0 && discount <= 100;
  const isWaValid = !!wa.name && !!wa.businessRegNumber && !!wa.productCategory && !!wa.subCategory && waReqPrice > 0 && waMarketPrice > 0;
  const isInfoValid = isPx ? isPxValid : isWaValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInfoValid) return;
    if (isPx) {
      dispatch({
        type: "ADD_VENDOR",
        vendor: {
          name: px.name,
          item: "PX/BX 위탁운영",
          subCategory: px.subCategory,
          vendorChannel: "PX/BX",
          vendorType: px.vendorType,
          qualificationScore: qualification,
          discountRate: discount,
          documents,
        },
      });
    } else {
      dispatch({
        type: "ADD_VENDOR",
        vendor: {
          name: wa.name,
          item: "WA-mall 일반상품",
          subCategory: wa.subCategory,
          vendorChannel: "WA-mall",
          businessRegNumber: wa.businessRegNumber,
          vendorSaleType: wa.vendorSaleType,
          productCategory: wa.productCategory,
          requestedPrice: waReqPrice,
          marketLowestPrice: waMarketPrice,
          documents,
        },
      });
    }
    setPx({ name: "", subCategory: "", vendorType: "일반", qualificationScore: "", discountRate: "" });
    setWa({ name: "", businessRegNumber: "", productCategory: "", subCategory: "", vendorSaleType: "직접제조판매", requestedPrice: "", marketLowestPrice: "" });
    setDocuments({});
    setSubmitted(true);
    setActiveTab("info");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="w-4 h-4 text-amber-500" />
          업체 등록
        </CardTitle>
        <CardDescription>조달 채널을 선택하고 업체 정보를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── 채널 선택 ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setChannel("PX/BX"); setActiveTab("info"); setDocuments({}); }}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              channel === "PX/BX"
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            PX/BX 정기선정
          </button>
          <button
            type="button"
            onClick={() => { setChannel("WA-mall"); setActiveTab("info"); setDocuments({}); }}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              channel === "WA-mall"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Globe className="w-4 h-4" />
            WA-mall 일반상품
          </button>
        </div>

        {/* ── 탭 토글 ─────────────────────────────────── */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? isPx ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            업체 정보 입력
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "docs"
                ? isPx ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            구비서류 첨부
            {uploadedDocCount > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${isPx ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                {uploadedDocCount}/{requiredDocs.length}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "info" && (
            <>
              {/* ── PX/BX 폼 ─────────────────────── */}
              {isPx && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>업체명 *</Label>
                      <Input placeholder="(주)맛나식품" value={px.name}
                        onChange={(e) => setPx({ ...px, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>소분류명 *</Label>
                      <Input placeholder="과자류, 음료류…" value={px.subCategory}
                        onChange={(e) => setPx({ ...px, subCategory: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>신청유형</Label>
                    <Select value={px.vendorType} onValueChange={(v) => setPx({ ...px, vendorType: v as VendorType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="일반">일반 소분류</SelectItem>
                        <SelectItem value="경쟁과열">경쟁과열 소분류</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      ⑧ 개찰 기준 점수 입력
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          적격심사 점수 * <span className="text-slate-400">(80점↑ 개찰)</span>
                        </Label>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="0–100"
                          value={px.qualificationScore}
                          onChange={(e) => setPx({ ...px, qualificationScore: e.target.value })} />
                        {qualification > 0 && (
                          <div className="flex items-center gap-1">
                            {passed
                              ? <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-600">80점 이상 — 개찰 대상</span></>
                              : <><XCircle className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-500">80점 미달 — 개찰 제외</span></>
                            }
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          할인율 (%) <span className="text-slate-400">(합산 가산)</span>
                        </Label>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="0.0"
                          value={px.discountRate}
                          onChange={(e) => setPx({ ...px, discountRate: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {preview !== null && (
                    <div className={`rounded-lg p-3 text-white ${passed ? "bg-gradient-to-r from-amber-500 to-amber-700" : "bg-gradient-to-r from-slate-400 to-slate-600"}`}>
                      <p className="text-xs opacity-80">합산 점수 (적격심사 + 할인율)</p>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-bold">{preview}</span>
                        <span className="text-sm opacity-80 mb-0.5">점</span>
                        {passed && <Badge variant="secondary" className="mb-0.5 text-[10px]">개찰 대상</Badge>}
                      </div>
                      <p className="text-[10px] opacity-70 mt-1">{qualification} + {discount}% = {preview}점</p>
                    </div>
                  )}
                </>
              )}

              {/* ── WA-mall 폼 ─────────────────────── */}
              {!isPx && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>업체명 *</Label>
                      <Input placeholder="(주)뷰티라인" value={wa.name}
                        onChange={(e) => setWa({ ...wa, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>사업자등록번호 *</Label>
                      <Input placeholder="000-00-00000" value={wa.businessRegNumber}
                        onChange={(e) => setWa({ ...wa, businessRegNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>대분류 카테고리 *</Label>
                      <Select value={wa.productCategory} onValueChange={(v) => setWa({ ...wa, productCategory: v })}>
                        <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                        <SelectContent>
                          {WA_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>소분류명 *</Label>
                      <Input placeholder="스킨케어, 밀키트…" value={wa.subCategory}
                        onChange={(e) => setWa({ ...wa, subCategory: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>신청자격 유형</Label>
                    <Select value={wa.vendorSaleType} onValueChange={(v) => setWa({ ...wa, vendorSaleType: v as VendorSaleType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="직접제조판매">직접제조판매</SelectItem>
                        <SelectItem value="OEM">OEM</SelectItem>
                        <SelectItem value="수입">수입 (해외)</SelectItem>
                        <SelectItem value="판매대행">판매대행</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-3">
                      가격 적격 요건 (시중 최저가 대비 10% 이상 저렴)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">시중 온라인 최저가 (원) *</Label>
                        <Input type="number" min="0" placeholder="0"
                          value={wa.marketLowestPrice}
                          onChange={(e) => setWa({ ...wa, marketLowestPrice: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">복지단 판매 요청가 (원) *</Label>
                        <Input type="number" min="0" placeholder="0"
                          value={wa.requestedPrice}
                          onChange={(e) => setWa({ ...wa, requestedPrice: e.target.value })} />
                      </div>
                    </div>
                    {waReqPrice > 0 && waMarketPrice > 0 && (
                      <div className={`mt-3 rounded p-2 flex items-center justify-between ${waDiscountOk ? "bg-emerald-100" : "bg-red-100"}`}>
                        <div className="flex items-center gap-1">
                          {waDiscountOk
                            ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">가격 요건 충족</span></>
                            : <><XCircle className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-600 font-medium">가격 요건 미충족</span></>
                          }
                        </div>
                        <span className={`text-sm font-bold ${waDiscountOk ? "text-emerald-700" : "text-red-600"}`}>
                          {waDiscountPct.toFixed(1)}% 저렴 {waDiscountOk ? "✓" : "(10% 필요)"}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200">
                  ✓ 업체가 등록되었습니다.
                </div>
              )}

              <Button type="button" variant={isInfoValid ? "default" : "outline"} className="w-full gap-2"
                disabled={!isInfoValid} onClick={() => setActiveTab("docs")}>
                <Paperclip className="w-4 h-4" />
                다음 단계: 구비서류 첨부 →
              </Button>
            </>
          )}

          {activeTab === "docs" && (
            <>
              <div className={`rounded-lg px-3 py-2 text-xs mb-2 ${isPx ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                <strong>{isPx ? "⑤ 서류접수 단계" : "③ 서류접수 단계"}</strong> — 아래 서류를 첨부하여 제출하세요.
                <br />미첨부 서류는 제출 후 보완 제출 가능합니다.
              </div>

              <FileUpload requiredDocs={requiredDocs} value={documents} onChange={setDocuments} maxSizeMB={10} />

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200">
                  ✓ 업체가 등록되었습니다.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setActiveTab("info")} className="flex-1">
                  ← 이전
                </Button>
                <Button type="submit" disabled={!isInfoValid} className="flex-1">
                  업체 등록
                  {uploadedDocCount > 0 && (
                    <span className="ml-1.5 opacity-80 text-xs">({uploadedDocCount}건 첨부)</span>
                  )}
                </Button>
              </div>

              {uploadedDocCount < requiredDocs.length && (
                <p className="text-[10px] text-amber-600 text-center">
                  ⚠ 미첨부 서류 {requiredDocs.length - uploadedDocCount}건 — 제출 후 보완 가능
                </p>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
