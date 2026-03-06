"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcStudentScores } from "@/lib/scoring";
import type { SchoolLevel, DocMap } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import FileUpload, { type RequiredDoc } from "@/components/ui/file-upload";
import { Calculator, ClipboardList, Info, Paperclip, ExternalLink, CheckCircle2 } from "lucide-react";

const RANKS = ["이병", "일병", "상병", "병장", "하사", "중사", "상사", "원사", "준위", "소위", "중위", "대위", "소령", "중령", "대령", "준장", "소장", "중장", "대장"];

// 제출서류 목록 (공고문 기준 — 신청자가 등기우편으로 발송)
const DORM_REQUIRED_DOCS: RequiredDoc[] = [
  { key: "application",   label: "① 입사신청서",      description: "기관 양식 / 서명 필수",          accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
  { key: "family_reg",    label: "② 주민등록등본",     description: "가족관계 확인 / 발급일 3개월 내", accept: ".pdf,.jpg,.png" },
  { key: "service_cert",  label: "③ 현역복무확인서",   description: "소속 부대 인사담당 발급",         accept: ".pdf,.hwp,.doc,.docx,.jpg,.png" },
  { key: "student_photo", label: "④ 학생 증명사진",    description: "3×4cm, 3개월 이내 촬영",          accept: ".jpg,.jpeg,.png" },
  { key: "health_cert",   label: "⑤ 학생 건강진단서",  description: "전염성 질환 없음 확인",            accept: ".pdf,.jpg,.png" },
];

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
  // 제출서류 첨부 → 신청 정보 입력 순서
  const [activeTab, setActiveTab] = useState<"docs" | "info">("docs");

  const serviceYears = parseFloat(form.serviceYears) || 0;
  const studentDist = parseFloat(form.studentDistanceKm) || 0;
  const parentDist = parseFloat(form.parentDistanceKm) || 0;

  // 항상 실시간 점수 산정 (입력값 없으면 0점 기준)
  const scores = calcStudentScores(
    form.schoolLevel, serviceYears,
    studentDist, parentDist,
    form.isStudentInCity, form.isParentInCity,
    form.isMultiChild, form.isMulticultural, form.isSingleParent
  );

  const isInfoValid = !!form.name && !!form.school && !!form.parentUnit && !!form.parentRank;
  const uploadedDocCount = Object.values(documents).filter((arr) => (arr as unknown[]).length > 0).length;
  const allDocsUploaded = uploadedDocCount === DORM_REQUIRED_DOCS.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInfoValid) return;
    dispatch({
      type: "ADD_STUDENT",
      student: {
        name: form.name,
        school: form.school,
        schoolLevel: form.schoolLevel,
        parentUnit: form.parentUnit,
        parentRank: form.parentRank,
        serviceYears,
        studentDistanceKm: studentDist,
        parentDistanceKm: parentDist,
        isStudentInCity: form.isStudentInCity,
        isParentInCity: form.isParentInCity,
        isMultiChild: form.isMultiChild,
        isMulticultural: form.isMulticultural,
        isSingleParent: form.isSingleParent,
        documents,
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
    setActiveTab("docs");
    setTimeout(() => setSubmitted(false), 4000);
  };

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
            <span className="font-semibold text-blue-800">도착 서류를 ①에서 첨부 → ②에서 내용 입력 시 점수가 즉시 산정됩니다.</span>
          </div>
        </div>

        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          입사 신청서 접수 처리
        </CardTitle>
        <CardDescription>
          도착한 제출서류를 첨부하고 접수 내용을 입력하면 점수가 자동 산정됩니다
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── 실시간 점수 표시 (항상 상단 고정) ───────────── */}
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
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-[9px] opacity-70">학교</p>
              <p className="text-lg font-bold">{scores.schoolScore}</p>
              <p className="text-[9px] opacity-50">/40</p>
            </div>
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-[9px] opacity-70">복무기간</p>
              <p className="text-lg font-bold">{scores.serviceScore}</p>
              <p className="text-[9px] opacity-50">/40</p>
            </div>
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-[9px] opacity-70">학생거리</p>
              <p className="text-lg font-bold">{scores.studentDistScore}</p>
              <p className="text-[9px] opacity-50">/10</p>
            </div>
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-[9px] opacity-70">부모거리</p>
              <p className="text-lg font-bold">{scores.parentDistScore}</p>
              <p className="text-[9px] opacity-50">/10</p>
            </div>
          </div>
          {scores.bonusScore > 0 && (
            <div className="mt-2 text-center">
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px]">가점 +1점 포함</span>
            </div>
          )}
        </div>

        {/* ── 탭: ① 서류첨부 → ② 정보입력 ────────────────── */}
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
            ② 신청 내용 입력 · 접수 확정
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 탭①: 제출서류 첨부 ──────────────────────── */}
          {activeTab === "docs" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                신청자가 등기우편으로 발송한 서류를 스캔 또는 촬영하여 각 항목에 드래그앤드롭하세요.
                미첨부 항목은 추후 보완 가능합니다.
              </div>

              <FileUpload
                requiredDocs={DORM_REQUIRED_DOCS}
                value={documents}
                onChange={setDocuments}
                maxSizeMB={10}
              />

              {submitted && (
                <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  접수가 완료되었습니다. 자동 배정이 진행됩니다.
                </div>
              )}

              <Button type="button" className="w-full gap-2"
                onClick={() => setActiveTab("info")}>
                <Calculator className="w-4 h-4" />
                ② 신청 내용 입력 및 접수 확정 →
              </Button>

              {uploadedDocCount < DORM_REQUIRED_DOCS.length && uploadedDocCount > 0 && (
                <p className="text-[10px] text-amber-600 text-center">
                  ⚠ 미첨부 서류 {DORM_REQUIRED_DOCS.length - uploadedDocCount}건 — 접수 후 보완 제출 가능
                </p>
              )}
            </>
          )}

          {/* ── 탭②: 신청 내용 입력 ─────────────────────── */}
          {activeTab === "info" && (
            <>
              {/* 학생 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>학생 이름 *</Label>
                  <Input placeholder="홍길동" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>재학 학교 *</Label>
                  <Input placeholder="육군부사관학교부설고" value={form.school}
                    onChange={(e) => setForm({ ...form, school: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>학교급 *</Label>
                <Select value={form.schoolLevel} onValueChange={(v) => setForm({ ...form, schoolLevel: v as SchoolLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초등학생">초등학생 (배점 40점)</SelectItem>
                    <SelectItem value="중학생">중학생 (배점 40점)</SelectItem>
                    <SelectItem value="고등학생">고등학생 (배점 40점)</SelectItem>
                    <SelectItem value="대학생">대학생 (배점 35점)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 부(모) 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>부(모) 소속 부대 *</Label>
                  <Input placeholder="육군 1군단" value={form.parentUnit}
                    onChange={(e) => setForm({ ...form, parentUnit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>부(모) 계급 *</Label>
                  <Input list="ranks-list" placeholder="중령" value={form.parentRank}
                    onChange={(e) => setForm({ ...form, parentRank: e.target.value })} />
                  <datalist id="ranks-list">
                    {RANKS.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>복무기간 (년) — 임관일 기준 현역 복무기간 합산</Label>
                <Input type="number" min="0" max="40" step="0.5" placeholder="예: 28"
                  value={form.serviceYears}
                  onChange={(e) => setForm({ ...form, serviceYears: e.target.value })} />
                <p className="text-[10px] text-slate-500">35년 이상 = 40점 만점 / 1년마다 0.2점 차감</p>
              </div>

              <Separator />

              {/* 거리 배점 */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  거리 배점 기준 (각 최대 10점)
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
                <p className="text-xs font-semibold text-purple-700 mb-2">가점 (+1점, 중복 미적용)</p>
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
