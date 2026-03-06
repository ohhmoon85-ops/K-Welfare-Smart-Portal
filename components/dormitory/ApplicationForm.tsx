"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcStudentScores } from "@/lib/scoring";
import type { SchoolLevel, DocMap } from "@/lib/types";
import type { OcrResult } from "@/app/api/ocr/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import FileUpload, { type RequiredDoc } from "@/components/ui/file-upload";
import { Calculator, ClipboardList, Info, Paperclip, ExternalLink, CheckCircle2, Wand2, Loader2, AlertCircle } from "lucide-react";

const RANKS = ["이병", "일병", "상병", "병장", "하사", "중사", "상사", "원사", "준위", "소위", "중위", "대위", "소령", "중령", "대령", "준장", "소장", "중장", "대장"];

const DORM_REQUIRED_DOCS: RequiredDoc[] = [
  { key: "application",   label: "① 입사신청서",      description: "기관 양식 / 서명 필수",          accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
  { key: "family_reg",    label: "② 주민등록등본",     description: "가족관계 확인 / 발급일 3개월 내", accept: ".pdf,.jpg,.png" },
  { key: "service_cert",  label: "③ 현역복무확인서",   description: "소속 부대 인사담당 발급",         accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
  { key: "student_photo", label: "④ 학생 증명사진",    description: "3×4cm, 3개월 이내 촬영",          accept: ".jpg,.jpeg,.png" },
  { key: "health_cert",   label: "⑤ 학생 건강진단서",  description: "전염성 질환 없음 확인",            accept: ".pdf,.jpg,.png" },
];

// OCR로 자동 입력된 필드를 표시하기 위한 타입
type AutoFilledFields = Set<string>;

export default function ApplicationForm() {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    name: "",
    school: "",
    schoolLevel: "고등학생" as SchoolLevel,
    parentUnit: "",
    parentRank: "",
    serviceYears: "",
    studentDistanceKm: "",
    isStudentInCity: false,
    parentDistanceKm: "",
    isParentInCity: false,
    isMultiChild: false,
    isMulticultural: false,
    isSingleParent: false,
  });
  const [documents, setDocuments] = useState<DocMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"docs" | "info">("docs");

  // OCR 상태
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<(OcrResult & { warning?: string }) | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<AutoFilledFields>(new Set());

  const serviceYears = parseFloat(form.serviceYears) || 0;
  const studentDist = parseFloat(form.studentDistanceKm) || 0;
  const parentDist = parseFloat(form.parentDistanceKm) || 0;

  const scores = calcStudentScores(
    form.schoolLevel, serviceYears,
    studentDist, parentDist,
    form.isStudentInCity, form.isParentInCity,
    form.isMultiChild, form.isMulticultural, form.isSingleParent
  );

  const isInfoValid = !!form.name && !!form.school && !!form.parentUnit && !!form.parentRank;
  const uploadedDocCount = Object.values(documents).filter((arr) => (arr as unknown[]).length > 0).length;
  const allDocsUploaded = uploadedDocCount === DORM_REQUIRED_DOCS.length;

  // ── OCR 실행 ─────────────────────────────────────────────────────────────
  const handleOcr = async () => {
    // OCR에 적합한 이미지 파일만 수집 (입사신청서, 주민등록등본, 현역복무확인서)
    const targetKeys = ["application", "family_reg", "service_cert"];
    const files: File[] = [];
    for (const key of targetKeys) {
      const docFiles = documents[key];
      if (docFiles && docFiles.length > 0) {
        files.push(docFiles[0] as unknown as File);
      }
    }

    if (files.length === 0) {
      setOcrError("입사신청서, 주민등록등본, 현역복무확인서 중 최소 1개를 첨부해주세요.");
      return;
    }

    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());

      const data: OcrResult & { warning?: string } = await res.json();
      setOcrResult(data);

      // 추출된 필드를 폼에 자동 입력
      const filled = new Set<string>();
      const updates: Partial<typeof form> = {};

      if (data.studentName)     { updates.name        = data.studentName;                              filled.add("name"); }
      if (data.school)          { updates.school       = data.school;                                  filled.add("school"); }
      if (data.schoolLevel)     { updates.schoolLevel  = data.schoolLevel;                             filled.add("schoolLevel"); }
      if (data.parentUnit)      { updates.parentUnit   = data.parentUnit;                              filled.add("parentUnit"); }
      if (data.parentRank)      { updates.parentRank   = data.parentRank;                              filled.add("parentRank"); }
      if (data.serviceYears != null) { updates.serviceYears = String(data.serviceYears);              filled.add("serviceYears"); }
      if (data.isMultiChild != null) { updates.isMultiChild = data.isMultiChild;                      filled.add("isMultiChild"); }
      if (data.isSingleParent != null) { updates.isSingleParent = data.isSingleParent;                filled.add("isSingleParent"); }
      if (data.isMulticultural != null) { updates.isMulticultural = data.isMulticultural;             filled.add("isMulticultural"); }

      setForm((prev) => ({ ...prev, ...updates }));
      setAutoFilledFields(filled);

      // 자동 입력 완료 시 ② 탭으로 이동
      if (filled.size > 0) {
        setTimeout(() => setActiveTab("info"), 600);
      }
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInfoValid) return;
    dispatch({
      type: "ADD_STUDENT",
      student: {
        name: form.name, school: form.school, schoolLevel: form.schoolLevel,
        parentUnit: form.parentUnit, parentRank: form.parentRank,
        serviceYears, studentDistanceKm: studentDist, parentDistanceKm: parentDist,
        isStudentInCity: form.isStudentInCity, isParentInCity: form.isParentInCity,
        isMultiChild: form.isMultiChild, isMulticultural: form.isMulticultural,
        isSingleParent: form.isSingleParent, documents,
      },
    });
    setForm({
      name: "", school: "", schoolLevel: "고등학생", parentUnit: "", parentRank: "",
      serviceYears: "", studentDistanceKm: "", isStudentInCity: false,
      parentDistanceKm: "", isParentInCity: false,
      isMultiChild: false, isMulticultural: false, isSingleParent: false,
    });
    setDocuments({});
    setSubmitted(true);
    setOcrResult(null);
    setAutoFilledFields(new Set());
    setActiveTab("docs");
    setTimeout(() => setSubmitted(false), 4000);
  };

  // OCR 자동 입력된 필드 표시 헬퍼
  const autoLabel = (fieldKey: string) =>
    autoFilledFields.has(fieldKey) ? (
      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">
        <Wand2 className="w-2.5 h-2.5" /> AI 자동 입력
      </span>
    ) : null;

  return (
    <Card>
      <CardHeader>
        {/* 담당자 안내 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">담당자 전용 화면</span> — 신청자는{" "}
            <a href="https://www.welfare.mil.kr/content/content.do?m_code=878"
               target="_blank" rel="noopener noreferrer"
               className="underline inline-flex items-center gap-0.5 font-medium hover:text-blue-900">
              국군복지포털 정시모집 지원하기 <ExternalLink className="w-3 h-3" />
            </a>
            에서 온라인 접수 후 서류를 등기우편으로 발송합니다.
            <br />
            <span className="font-semibold text-blue-800">① 서류 첨부 → AI 자동 읽기 → ② 내용 확인 후 접수 확정</span>
          </div>
        </div>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          입사 신청서 접수 처리
        </CardTitle>
        <CardDescription>
          서류를 첨부하면 AI가 내용을 읽어 자동으로 입력합니다 — 담당자가 확인 후 접수 확정
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── 실시간 점수 (항상 상단 고정) ───────────────────── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold opacity-80 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" />
              실시간 자동 산정 점수
            </span>
            <span className="text-3xl font-bold tracking-tight">
              {scores.total}
              <span className="text-base font-normal opacity-60 ml-1">/101점</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "학교",    val: scores.schoolScore,      max: 40 },
              { label: "복무기간", val: scores.serviceScore,    max: 40 },
              { label: "학생거리", val: scores.studentDistScore, max: 10 },
              { label: "부모거리", val: scores.parentDistScore,  max: 10 },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-lg py-1.5">
                <p className="text-[9px] opacity-70">{item.label}</p>
                <p className="text-lg font-bold">{item.val}</p>
                <p className="text-[9px] opacity-50">/{item.max}</p>
              </div>
            ))}
          </div>
          {scores.bonusScore > 0 && (
            <div className="mt-2 text-center">
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px]">가점 +1점 포함</span>
            </div>
          )}
        </div>

        {/* ── 탭 ──────────────────────────────────────────────── */}
        <div className="flex border-b mb-5">
          <button type="button" onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "docs" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Paperclip className="w-3.5 h-3.5" />
            ① 제출서류 첨부
            {uploadedDocCount > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                allDocsUploaded ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}>
                {uploadedDocCount}/{DORM_REQUIRED_DOCS.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "info" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Calculator className="w-3.5 h-3.5" />
            ② 내용 확인 · 접수 확정
            {autoFilledFields.size > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {autoFilledFields.size}개 자동 입력
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 탭①: 제출서류 첨부 + OCR ────────────────────── */}
          {activeTab === "docs" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                신청자가 등기우편으로 발송한 서류를 스캔 또는 촬영하여 드래그앤드롭하세요.
                이후 <strong>AI 자동 읽기</strong>를 실행하면 입사신청서·주민등록등본·현역복무확인서에서 내용이 자동으로 입력됩니다.
              </div>

              <FileUpload
                requiredDocs={DORM_REQUIRED_DOCS}
                value={documents}
                onChange={setDocuments}
                maxSizeMB={10}
              />

              {/* OCR 버튼 */}
              <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">AI 자동 읽기 (OCR)</span>
                  <Badge variant="secondary" className="text-[10px]">Claude Vision</Badge>
                </div>
                <p className="text-xs text-emerald-700">
                  첨부된 서류에서 <strong>학생 정보·복무기간·가점 항목</strong>을 자동으로 추출합니다.
                  추출 후 ②에서 내용을 확인하고 수정 가능합니다.
                </p>

                {ocrError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {ocrError}
                  </div>
                )}

                {ocrResult && (
                  <div className={`rounded-lg px-3 py-2 text-xs space-y-1 ${ocrResult.source === "mock" ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ocrResult.extractedFields.length}개 필드 자동 입력 완료</span>
                      <Badge variant={ocrResult.confidence === "high" ? "success" : "warning"} className="text-[9px]">
                        신뢰도 {ocrResult.confidence === "high" ? "높음" : ocrResult.confidence === "medium" ? "중간" : "낮음"}
                      </Badge>
                      {ocrResult.source === "mock" && (
                        <Badge variant="secondary" className="text-[9px]">Mock 데이터</Badge>
                      )}
                    </div>
                    {ocrResult.warning && (
                      <p className="text-amber-700">{ocrResult.warning}</p>
                    )}
                  </div>
                )}

                <Button type="button" disabled={ocrLoading || uploadedDocCount === 0}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleOcr}>
                  {ocrLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> AI가 서류를 읽는 중…</>
                    : <><Wand2 className="w-4 h-4" /> AI 자동 읽기 실행</>
                  }
                </Button>
                {uploadedDocCount === 0 && (
                  <p className="text-[10px] text-slate-400 text-center">서류를 먼저 첨부하면 AI 자동 읽기가 활성화됩니다</p>
                )}
              </div>

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수가 완료되었습니다. 자동 배정이 진행됩니다.
                </div>
              )}

              <Button type="button" className="w-full gap-2" onClick={() => setActiveTab("info")}>
                <Calculator className="w-4 h-4" />
                ② 내용 확인 및 접수 확정 →
              </Button>

              {uploadedDocCount > 0 && uploadedDocCount < DORM_REQUIRED_DOCS.length && (
                <p className="text-[10px] text-amber-600 text-center">
                  ⚠ 미첨부 서류 {DORM_REQUIRED_DOCS.length - uploadedDocCount}건 — 접수 후 보완 가능
                </p>
              )}
            </>
          )}

          {/* ── 탭②: 내용 확인 · 접수 확정 ─────────────────── */}
          {activeTab === "info" && (
            <>
              {autoFilledFields.size > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-emerald-700">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI가 <strong>{autoFilledFields.size}개 항목</strong>을 자동으로 입력했습니다. 내용을 확인하고 필요 시 수정하세요.</span>
                </div>
              )}

              {/* 학생 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>학생 이름 * {autoLabel("name")}</Label>
                  <Input placeholder="홍길동" value={form.name}
                    className={autoFilledFields.has("name") ? "border-emerald-400 bg-emerald-50" : ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>재학 학교 * {autoLabel("school")}</Label>
                  <Input placeholder="육군부사관학교부설고" value={form.school}
                    className={autoFilledFields.has("school") ? "border-emerald-400 bg-emerald-50" : ""}
                    onChange={(e) => setForm({ ...form, school: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>학교급 * {autoLabel("schoolLevel")}</Label>
                <Select value={form.schoolLevel} onValueChange={(v) => setForm({ ...form, schoolLevel: v as SchoolLevel })}>
                  <SelectTrigger className={autoFilledFields.has("schoolLevel") ? "border-emerald-400 bg-emerald-50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초등학생">초등학생 (배점 40점)</SelectItem>
                    <SelectItem value="중학생">중학생 (배점 40점)</SelectItem>
                    <SelectItem value="고등학생">고등학생 (배점 40점)</SelectItem>
                    <SelectItem value="대학생">대학생 (배점 35점)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>부(모) 소속 부대 * {autoLabel("parentUnit")}</Label>
                  <Input placeholder="육군 1군단" value={form.parentUnit}
                    className={autoFilledFields.has("parentUnit") ? "border-emerald-400 bg-emerald-50" : ""}
                    onChange={(e) => setForm({ ...form, parentUnit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>부(모) 계급 * {autoLabel("parentRank")}</Label>
                  <Input list="ranks-list" placeholder="중령" value={form.parentRank}
                    className={autoFilledFields.has("parentRank") ? "border-emerald-400 bg-emerald-50" : ""}
                    onChange={(e) => setForm({ ...form, parentRank: e.target.value })} />
                  <datalist id="ranks-list">
                    {RANKS.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>복무기간 (년) {autoLabel("serviceYears")}</Label>
                <Input type="number" min="0" max="40" step="0.5" placeholder="예: 28"
                  value={form.serviceYears}
                  className={autoFilledFields.has("serviceYears") ? "border-emerald-400 bg-emerald-50" : ""}
                  onChange={(e) => setForm({ ...form, serviceYears: e.target.value })} />
                <p className="text-[10px] text-slate-500">35년 이상 = 40점 만점 / 1년마다 0.2점 차감</p>
              </div>

              <Separator />

              {/* 거리 배점 (수동 입력 필요) */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  거리 배점 기준 <span className="text-blue-500 font-normal">(각 최대 10점 — 직접 입력)</span>
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">기숙사 ↔ 학생 주소지 직선거리 (km)</Label>
                      <Input type="number" min="0" step="1" placeholder="0"
                        value={form.studentDistanceKm}
                        onChange={(e) => setForm({ ...form, studentDistanceKm: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pb-1">
                      <input type="checkbox" checked={form.isStudentInCity}
                        onChange={(e) => setForm({ ...form, isStudentInCity: e.target.checked })}
                        className="rounded" />
                      <span className="text-xs text-slate-600">기숙사 소재 시내 거주 (0점)</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">기숙사 ↔ 부(모) 근무지 직선거리 (km)</Label>
                      <Input type="number" min="0" step="1" placeholder="0"
                        value={form.parentDistanceKm}
                        onChange={(e) => setForm({ ...form, parentDistanceKm: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pb-1">
                      <input type="checkbox" checked={form.isParentInCity}
                        onChange={(e) => setForm({ ...form, isParentInCity: e.target.checked })}
                        className="rounded" />
                      <span className="text-xs text-slate-600">기숙사 소재 시내 근무 (0점)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 가점 */}
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">
                  가점 (+1점, 중복 미적용) {(autoFilledFields.has("isMultiChild") || autoFilledFields.has("isSingleParent") || autoFilledFields.has("isMulticultural")) && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">
                      <Wand2 className="w-2.5 h-2.5" /> AI 자동 입력
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  {[
                    { key: "isMultiChild",    label: "세자녀 이상 부양가구" },
                    { key: "isMulticultural", label: "다문화 가정" },
                    { key: "isSingleParent",  label: "한부모 가정" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="rounded" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수가 완료되었습니다. 점수 기반 자동 배정이 진행됩니다.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setActiveTab("docs")} className="flex-1">
                  ← 서류 첨부로 돌아가기
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
                  학생 이름, 학교, 부대, 계급을 모두 입력해야 접수 처리가 가능합니다
                </p>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
