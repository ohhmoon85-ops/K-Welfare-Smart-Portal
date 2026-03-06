"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcVendorTotal, QUALIFICATION_THRESHOLD } from "@/lib/scoring";
import type { VendorType, VendorSaleType, DocMap } from "@/lib/types";
import type { VendorOcrResult } from "@/app/api/ocr/vendor/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import FileUpload, { type RequiredDoc } from "@/components/ui/file-upload";
import {
  Calculator, ClipboardList, Info, Paperclip, CheckCircle2, XCircle,
  Globe, ShoppingBag, Sparkles, Loader2, AlertCircle,
} from "lucide-react";

// ─── PX/BX 구비서류 ─────────────────────────────────────────────────────────
const PX_DOCS: RequiredDoc[] = [
  { key: "application",      label: "① 입찰참가신청서",              description: "기관 양식 / 직인 필수",              accept: ".pdf,.hwp,.doc,.docx" },
  { key: "business_reg",     label: "② 사업자등록증",                description: "사본 가능 / 최신본",                 accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "pos_receipt",      label: "③ POS 영수증 (최근 3개년)",     description: "판매 실적 확인용",                   accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls" },
  { key: "subcategory_cert", label: "④ 소분류확인서 (판매과 발급)",  description: "해당 소분류 거래 확인",               accept: ".pdf,.hwp,.doc,.docx" },
  { key: "type_docs",        label: "⑤ 신청유형별 관련서류",         description: "일반/경쟁과열 유형 추가 서류",       accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
];

// ─── WA-mall 구비서류 ────────────────────────────────────────────────────────
const WA_DOCS: RequiredDoc[] = [
  { key: "wa_application", label: "① 신청서 (별지 #1)",            description: "국군복지단 선정관리시스템 출력본",   accept: ".pdf,.hwp,.doc,.docx" },
  { key: "product_image",  label: "② 물품 대표 이미지",            description: "정면·측면·후면 3종 이상",            accept: ".jpg,.jpeg,.png" },
  { key: "distribution",   label: "③ 유통 증빙 자료",              description: "시중 종합몰 2개소 이상 판매 캡처",   accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "business_cert",  label: "④ 사업자등록증명원",            description: "최근 3개월 이내 발급",               accept: ".pdf,.jpg,.png" },
  { key: "test_report",    label: "⑤ 시험성적서 / 품목제조보고서", description: "해당 품목 기준 (식품 등 필수)",      accept: ".pdf,.jpg,.png" },
];

const WA_CATEGORIES = [
  "화장품", "패션잡화", "패션의류", "스포츠/레저", "유아동",
  "가전/디지털/컴퓨터", "가구/침구", "주방/생활/건강", "식품", "애완/취미/자동차용품",
];

// OCR 자동 입력된 필드에 붙이는 스타일
function autoStyle(autoFilledFields: Set<string>, field: string) {
  return autoFilledFields.has(field)
    ? "border-emerald-400 bg-emerald-50 focus-visible:ring-emerald-400"
    : "";
}

export default function VendorForm() {
  const { dispatch } = useApp();
  const [channel, setChannel] = useState<"PX/BX" | "WA-mall">("PX/BX");
  const [activeTab, setActiveTab] = useState<"docs" | "info">("docs");
  const [submitted, setSubmitted] = useState(false);
  const [documents, setDocuments] = useState<DocMap>({});

  const [px, setPx] = useState({
    name: "", subCategory: "", vendorType: "일반" as VendorType,
    qualificationScore: "", discountRate: "",
  });
  const [wa, setWa] = useState({
    name: "", businessRegNumber: "", productCategory: "", subCategory: "",
    vendorSaleType: "직접제조판매" as VendorSaleType, requestedPrice: "", marketLowestPrice: "",
  });

  // ── OCR 상태 ──
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<VendorOcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // ── 실시간 산정 값 ──
  const isPx = channel === "PX/BX";
  const qualification = parseFloat(px.qualificationScore) || 0;
  const discount = parseFloat(px.discountRate) || 0;
  const pxTotal = calcVendorTotal(qualification, discount);
  const pxPassed = qualification >= QUALIFICATION_THRESHOLD;

  const waReqPrice = parseFloat(wa.requestedPrice) || 0;
  const waMarketPrice = parseFloat(wa.marketLowestPrice) || 0;
  const waDiscountOk = waMarketPrice > 0 && waReqPrice > 0 && waReqPrice <= waMarketPrice * 0.9;
  const waDiscountPct = waMarketPrice > 0 && waReqPrice > 0
    ? Math.round((1 - waReqPrice / waMarketPrice) * 1000) / 10
    : 0;

  const requiredDocs = isPx ? PX_DOCS : WA_DOCS;
  const uploadedDocCount = Object.values(documents).filter((arr) => (arr as unknown[]).length > 0).length;

  const isPxValid = !!px.name && !!px.subCategory;
  const isWaValid = !!wa.name && !!wa.businessRegNumber && !!wa.productCategory && !!wa.subCategory && waReqPrice > 0 && waMarketPrice > 0;
  const isInfoValid = isPx ? isPxValid : isWaValid;

  // ── OCR 실행 ──
  const handleOcr = async () => {
    // 이미지 형식 파일만 수집
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const files: File[] = [];
    for (const docFiles of Object.values(documents)) {
      if (!docFiles) continue;
      for (const f of docFiles as unknown as File[]) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (imageExts.includes(ext)) files.push(f);
      }
      if (files.length >= 4) break;
    }

    if (files.length === 0) {
      setOcrError("JPG/PNG 이미지 서류를 1개 이상 첨부하면 AI가 자동으로 정보를 읽어옵니다.");
      return;
    }

    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("channel", channel);

      const res = await fetch("/api/ocr/vendor", { method: "POST", body: formData });
      if (!res.ok) throw new Error("OCR 서버 오류");
      const data: VendorOcrResult & { warning?: string } = await res.json();

      setOcrResult(data);
      const filled = new Set<string>();

      if (isPx) {
        if (data.name)               { setPx((p) => ({ ...p, name: data.name! }));                                         filled.add("px_name"); }
        if (data.subCategory)        { setPx((p) => ({ ...p, subCategory: data.subCategory! }));                           filled.add("px_subCategory"); }
        if (data.vendorType)         { setPx((p) => ({ ...p, vendorType: data.vendorType! }));                             filled.add("px_vendorType"); }
        if (data.qualificationScore !== undefined) { setPx((p) => ({ ...p, qualificationScore: String(data.qualificationScore) })); filled.add("px_qualificationScore"); }
        if (data.discountRate !== undefined)       { setPx((p) => ({ ...p, discountRate: String(data.discountRate) }));            filled.add("px_discountRate"); }
      } else {
        if (data.name)               { setWa((w) => ({ ...w, name: data.name! }));                                         filled.add("wa_name"); }
        if (data.businessRegNumber)  { setWa((w) => ({ ...w, businessRegNumber: data.businessRegNumber! }));               filled.add("wa_businessRegNumber"); }
        if (data.productCategory)    { setWa((w) => ({ ...w, productCategory: data.productCategory! }));                   filled.add("wa_productCategory"); }
        if (data.subCategory)        { setWa((w) => ({ ...w, subCategory: data.subCategory! }));                           filled.add("wa_subCategory"); }
        if (data.vendorSaleType)     { setWa((w) => ({ ...w, vendorSaleType: data.vendorSaleType! }));                     filled.add("wa_vendorSaleType"); }
        if (data.marketLowestPrice !== undefined)  { setWa((w) => ({ ...w, marketLowestPrice: String(data.marketLowestPrice) })); filled.add("wa_marketLowestPrice"); }
        if (data.requestedPrice !== undefined)     { setWa((w) => ({ ...w, requestedPrice: String(data.requestedPrice) }));       filled.add("wa_requestedPrice"); }
      }

      setAutoFilledFields(filled);
      if (filled.size > 0) setActiveTab("info");

    } catch {
      setOcrError("OCR 처리 중 오류가 발생했습니다. 수동으로 입력해주세요.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInfoValid) return;
    if (isPx) {
      dispatch({
        type: "ADD_VENDOR",
        vendor: {
          name: px.name, item: "PX/BX 위탁운영", subCategory: px.subCategory,
          vendorChannel: "PX/BX", vendorType: px.vendorType,
          qualificationScore: qualification, discountRate: discount, documents,
        },
      });
    } else {
      dispatch({
        type: "ADD_VENDOR",
        vendor: {
          name: wa.name, item: "WA-mall 일반상품", subCategory: wa.subCategory,
          vendorChannel: "WA-mall", businessRegNumber: wa.businessRegNumber,
          vendorSaleType: wa.vendorSaleType, productCategory: wa.productCategory,
          requestedPrice: waReqPrice, marketLowestPrice: waMarketPrice, documents,
        },
      });
    }
    setPx({ name: "", subCategory: "", vendorType: "일반", qualificationScore: "", discountRate: "" });
    setWa({ name: "", businessRegNumber: "", productCategory: "", subCategory: "", vendorSaleType: "직접제조판매", requestedPrice: "", marketLowestPrice: "" });
    setDocuments({});
    setOcrResult(null);
    setAutoFilledFields(new Set());
    setSubmitted(true);
    setActiveTab("docs");
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <Card>
      <CardHeader>
        {/* 담당자 안내 배너 */}
        <div className={`border rounded-lg px-3 py-2 mb-3 flex items-start gap-2 ${isPx ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isPx ? "text-amber-500" : "text-blue-500"}`} />
          <div className={`text-xs leading-relaxed ${isPx ? "text-amber-700" : "text-blue-700"}`}>
            <span className="font-semibold">담당자 전용 화면</span> —{" "}
            {isPx
              ? "업체는 국군복지단 선정공고 후 전산 신청 및 서류를 제출합니다."
              : "업체는 국군복지단 선정관리시스템에서 전산입력 후 서류를 제출합니다."
            }
            <br />
            <span className="font-semibold">① 제출된 서류를 첨부 → AI 자동 읽기 → ② 업체 정보 확인·접수 확정</span>
          </div>
        </div>

        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="w-4 h-4 text-amber-500" />
          업체 서류 접수 처리
        </CardTitle>
        <CardDescription>조달 채널을 선택하고 제출서류를 첨부한 뒤 정보를 확인하세요</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── 채널 선택 ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button"
            onClick={() => { setChannel("PX/BX"); setActiveTab("docs"); setDocuments({}); setOcrResult(null); setAutoFilledFields(new Set()); }}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              isPx ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}>
            <ShoppingBag className="w-4 h-4" />
            PX/BX 정기선정
          </button>
          <button type="button"
            onClick={() => { setChannel("WA-mall"); setActiveTab("docs"); setDocuments({}); setOcrResult(null); setAutoFilledFields(new Set()); }}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              !isPx ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}>
            <Globe className="w-4 h-4" />
            WA-mall 일반상품
          </button>
        </div>

        {/* ── 실시간 적격/점수 표시 (항상 상단 고정) ─────────── */}
        {isPx ? (
          <div className={`rounded-xl p-4 text-white ${pxPassed ? "bg-gradient-to-r from-amber-500 to-amber-700" : "bg-gradient-to-r from-slate-500 to-slate-700"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold opacity-80 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                실시간 합산 점수
              </span>
              <div className="flex items-center gap-2">
                {pxPassed
                  ? <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">개찰 대상</span>
                  : <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">80점 미달 — 개찰 제외</span>
                }
                <span className="text-3xl font-bold">{pxTotal}<span className="text-sm font-normal opacity-60 ml-1">점</span></span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-lg py-2">
                <p className="text-[9px] opacity-70">적격심사</p>
                <p className="text-xl font-bold">{qualification}</p>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {qualification >= QUALIFICATION_THRESHOLD
                    ? <><CheckCircle2 className="w-3 h-3 text-emerald-300" /><span className="text-[9px] text-emerald-200">통과</span></>
                    : <><XCircle className="w-3 h-3 text-red-300" /><span className="text-[9px] text-red-200">미달</span></>
                  }
                </div>
              </div>
              <div className="bg-white/10 rounded-lg py-2">
                <p className="text-[9px] opacity-70">할인율</p>
                <p className="text-xl font-bold">{discount}<span className="text-xs">%</span></p>
                <p className="text-[9px] opacity-50 mt-0.5">합산 가산</p>
              </div>
              <div className="bg-white/20 rounded-lg py-2">
                <p className="text-[9px] opacity-70">합산 점수</p>
                <p className="text-xl font-bold">{pxTotal}</p>
                <p className="text-[9px] opacity-50 mt-0.5">소분류 순위 기준</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl p-4 text-white ${waDiscountOk ? "bg-gradient-to-r from-blue-500 to-blue-700" : "bg-gradient-to-r from-slate-500 to-slate-700"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold opacity-80 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                실시간 가격 적격 심사
              </span>
              <div className="flex items-center gap-2">
                {waMarketPrice > 0 && waReqPrice > 0
                  ? waDiscountOk
                    ? <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">가격 요건 충족</span>
                    : <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">가격 요건 미충족</span>
                  : <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full opacity-60">가격 미입력</span>
                }
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-lg py-2">
                <p className="text-[9px] opacity-70">시중 최저가</p>
                <p className="text-sm font-bold">{waMarketPrice > 0 ? waMarketPrice.toLocaleString() : "—"}</p>
                <p className="text-[9px] opacity-50 mt-0.5">원</p>
              </div>
              <div className="bg-white/10 rounded-lg py-2">
                <p className="text-[9px] opacity-70">판매 요청가</p>
                <p className="text-sm font-bold">{waReqPrice > 0 ? waReqPrice.toLocaleString() : "—"}</p>
                <p className="text-[9px] opacity-50 mt-0.5">원</p>
              </div>
              <div className="bg-white/20 rounded-lg py-2">
                <p className="text-[9px] opacity-70">할인율</p>
                <p className="text-xl font-bold">{waDiscountPct.toFixed(1)}<span className="text-xs">%</span></p>
                <p className="text-[9px] opacity-50 mt-0.5">10% 이상 필요</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 탭: ① 서류 접수 → ② 업체 정보 입력 ───────────── */}
        <div className="flex border-b">
          <button type="button" onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "docs"
                ? isPx ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Paperclip className="w-3.5 h-3.5" />
            ① 제출서류 접수
            {uploadedDocCount > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                uploadedDocCount === requiredDocs.length
                  ? "bg-emerald-100 text-emerald-700"
                  : isPx ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                {uploadedDocCount}/{requiredDocs.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? isPx ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Calculator className="w-3.5 h-3.5" />
            ② 업체 정보 확인 · 접수 확정
            {autoFilledFields.size > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold rounded-full px-1.5 py-0.5 leading-none">
                AI {autoFilledFields.size}개 자동입력
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 탭①: 제출서류 접수 ─────────────────────────── */}
          {activeTab === "docs" && (
            <>
              <div className={`border rounded-lg px-3 py-2 text-xs ${isPx ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                업체가 제출한 서류를 스캔하여 각 항목에 드래그앤드롭하세요.
                JPG/PNG 이미지 첨부 시 AI가 업체 정보를 자동으로 읽어옵니다.
              </div>

              <FileUpload requiredDocs={requiredDocs} value={documents} onChange={setDocuments} maxSizeMB={10} />

              {/* AI 자동 읽기 버튼 */}
              <div className={`rounded-xl p-4 space-y-3 ${isPx ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isPx ? "text-amber-500" : "text-blue-500"}`} />
                  <p className={`text-xs font-semibold ${isPx ? "text-amber-700" : "text-blue-700"}`}>
                    AI 자동 읽기 (Claude Vision)
                  </p>
                </div>
                <p className="text-[10px] text-slate-500">
                  첨부된 JPG/PNG 서류에서 업체명·사업자번호·점수 등을 자동으로 추출하여 ②탭에 입력합니다.
                </p>

                {ocrError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {ocrError}
                  </div>
                )}

                {ocrResult && (
                  <div className={`rounded-lg px-3 py-2 text-xs space-y-1 ${
                    ocrResult.source === "mock"
                      ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  }`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ocrResult.source === "mock" ? "Mock 데이터 (API 키 미설정)" : "AI 자동 추출 완료"}
                      <Badge variant={ocrResult.confidence === "high" ? "success" : ocrResult.confidence === "medium" ? "warning" : "secondary"}
                        className="text-[9px] py-0">
                        {ocrResult.confidence === "high" ? "높음" : ocrResult.confidence === "medium" ? "보통" : "낮음"}
                      </Badge>
                    </div>
                    <p>{ocrResult.extractedFields.length}개 필드 자동 입력 — ②탭에서 확인·수정하세요.</p>
                    {(ocrResult as VendorOcrResult & { warning?: string }).warning && (
                      <p className="text-yellow-700 text-[10px]">
                        {(ocrResult as VendorOcrResult & { warning?: string }).warning}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleOcr}
                  disabled={ocrLoading || uploadedDocCount === 0}
                  className={`w-full gap-2 ${isPx
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}>
                  {ocrLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> AI가 서류를 읽는 중…</>
                    : <><Sparkles className="w-4 h-4" /> AI 자동 읽기</>
                  }
                </Button>
                {uploadedDocCount === 0 && (
                  <p className="text-[10px] text-slate-400 text-center">서류를 먼저 첨부하면 활성화됩니다</p>
                )}
              </div>

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수가 완료되었습니다. 업체 현황에서 확인하세요.
                </div>
              )}

              <Button type="button" className="w-full gap-2"
                onClick={() => setActiveTab("info")}>
                <Calculator className="w-4 h-4" />
                ② 업체 정보 입력 및 접수 확정 →
              </Button>

              {uploadedDocCount > 0 && uploadedDocCount < requiredDocs.length && (
                <p className="text-[10px] text-amber-600 text-center">
                  ⚠ 미첨부 서류 {requiredDocs.length - uploadedDocCount}건 — 접수 후 보완 제출 가능
                </p>
              )}
            </>
          )}

          {/* ── 탭②: 업체 정보 입력 ──────────────────────────── */}
          {activeTab === "info" && (
            <>
              {autoFilledFields.size > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="font-semibold">AI가 {autoFilledFields.size}개 필드를 자동 입력</span>했습니다.
                    초록색 표시 항목을 반드시 확인하고 필요시 수정하세요.
                  </span>
                </div>
              )}

              {/* PX/BX 폼 */}
              {isPx && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        업체명 *
                        {autoFilledFields.has("px_name") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Input placeholder="(주)맛나식품" value={px.name}
                        className={autoStyle(autoFilledFields, "px_name")}
                        onChange={(e) => setPx({ ...px, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        소분류명 *
                        {autoFilledFields.has("px_subCategory") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Input placeholder="과자류, 음료류…" value={px.subCategory}
                        className={autoStyle(autoFilledFields, "px_subCategory")}
                        onChange={(e) => setPx({ ...px, subCategory: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      신청유형
                      {autoFilledFields.has("px_vendorType") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                    </Label>
                    <Select value={px.vendorType} onValueChange={(v) => setPx({ ...px, vendorType: v as VendorType })}>
                      <SelectTrigger className={autoStyle(autoFilledFields, "px_vendorType")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="일반">일반 소분류</SelectItem>
                        <SelectItem value="경쟁과열">경쟁과열 소분류</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="bg-amber-50 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      ⑧ 개찰 기준 점수 입력
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          적격심사 점수 <span className="text-slate-400">(80점↑ 개찰)</span>
                          {autoFilledFields.has("px_qualificationScore") && <Badge variant="success" className="text-[9px] py-0">AI</Badge>}
                        </Label>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="0–100"
                          value={px.qualificationScore}
                          className={autoStyle(autoFilledFields, "px_qualificationScore")}
                          onChange={(e) => setPx({ ...px, qualificationScore: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          할인율 (%) <span className="text-slate-400">(합산 가산)</span>
                          {autoFilledFields.has("px_discountRate") && <Badge variant="success" className="text-[9px] py-0">AI</Badge>}
                        </Label>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="0.0"
                          value={px.discountRate}
                          className={autoStyle(autoFilledFields, "px_discountRate")}
                          onChange={(e) => setPx({ ...px, discountRate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* WA-mall 폼 */}
              {!isPx && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        업체명 *
                        {autoFilledFields.has("wa_name") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Input placeholder="(주)뷰티라인" value={wa.name}
                        className={autoStyle(autoFilledFields, "wa_name")}
                        onChange={(e) => setWa({ ...wa, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        사업자등록번호 *
                        {autoFilledFields.has("wa_businessRegNumber") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Input placeholder="000-00-00000" value={wa.businessRegNumber}
                        className={autoStyle(autoFilledFields, "wa_businessRegNumber")}
                        onChange={(e) => setWa({ ...wa, businessRegNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        대분류 카테고리 *
                        {autoFilledFields.has("wa_productCategory") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Select value={wa.productCategory} onValueChange={(v) => setWa({ ...wa, productCategory: v })}>
                        <SelectTrigger className={autoStyle(autoFilledFields, "wa_productCategory")}>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {WA_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        소분류명 *
                        {autoFilledFields.has("wa_subCategory") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                      </Label>
                      <Input placeholder="스킨케어, 밀키트…" value={wa.subCategory}
                        className={autoStyle(autoFilledFields, "wa_subCategory")}
                        onChange={(e) => setWa({ ...wa, subCategory: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      신청자격 유형
                      {autoFilledFields.has("wa_vendorSaleType") && <Badge variant="success" className="text-[9px] py-0">AI 자동 입력</Badge>}
                    </Label>
                    <Select value={wa.vendorSaleType} onValueChange={(v) => setWa({ ...wa, vendorSaleType: v as VendorSaleType })}>
                      <SelectTrigger className={autoStyle(autoFilledFields, "wa_vendorSaleType")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="직접제조판매">직접제조판매</SelectItem>
                        <SelectItem value="OEM">OEM</SelectItem>
                        <SelectItem value="수입">수입 (해외)</SelectItem>
                        <SelectItem value="판매대행">판매대행</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold text-blue-700">가격 적격 요건 (시중 최저가 10% 이상 저렴)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          시중 온라인 최저가 (원) *
                          {autoFilledFields.has("wa_marketLowestPrice") && <Badge variant="success" className="text-[9px] py-0">AI</Badge>}
                        </Label>
                        <Input type="number" min="0" placeholder="0"
                          value={wa.marketLowestPrice}
                          className={autoStyle(autoFilledFields, "wa_marketLowestPrice")}
                          onChange={(e) => setWa({ ...wa, marketLowestPrice: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          복지단 판매 요청가 (원) *
                          {autoFilledFields.has("wa_requestedPrice") && <Badge variant="success" className="text-[9px] py-0">AI</Badge>}
                        </Label>
                        <Input type="number" min="0" placeholder="0"
                          value={wa.requestedPrice}
                          className={autoStyle(autoFilledFields, "wa_requestedPrice")}
                          onChange={(e) => setWa({ ...wa, requestedPrice: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수가 완료되었습니다.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setActiveTab("docs")} className="flex-1">
                  ← 서류 접수로 돌아가기
                </Button>
                <Button type="submit" disabled={!isInfoValid} className="flex-1 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수 처리 완료
                  {uploadedDocCount > 0 && (
                    <span className="opacity-70 text-xs">({uploadedDocCount}건 첨부)</span>
                  )}
                </Button>
              </div>

              {!isInfoValid && (
                <p className="text-[10px] text-slate-400 text-center">
                  {isPx ? "업체명과 소분류명을 입력해야 접수 처리가 가능합니다" : "업체명, 사업자번호, 카테고리, 가격을 모두 입력해야 합니다"}
                </p>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
