"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, MapPin, Star, ArrowUpDown, FileCheck } from "lucide-react";

export default function ScoringCriteria() {
  return (
    <div className="space-y-4">

      {/* 총점 요약 */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "① 재학중인 학교", max: 40, color: "bg-blue-500",    desc: "학교급 기준" },
          { label: "② 부(모) 복무기간", max: 40, color: "bg-emerald-500", desc: "임관일 기준" },
          { label: "③ 학생 주소지", max: 10, color: "bg-amber-500",   desc: "기숙사 기준 거리" },
          { label: "④ 부모 근무지역", max: 10, color: "bg-orange-500",  desc: "기숙사 기준 거리" },
          { label: "⑤ 가점", max: 1,  color: "bg-purple-500",  desc: "세자녀·다문화·한부모" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border p-3 text-center shadow-sm">
            <div className={`w-6 h-1.5 rounded-full mx-auto mb-2 ${item.color}`} />
            <p className="text-[10px] font-semibold text-slate-700 leading-tight">{item.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{item.max}</p>
            <p className="text-[10px] text-slate-400">점</p>
            <p className="text-[9px] text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-right text-xs text-slate-500">총점 최대 <strong className="text-blue-600">101점</strong> (100점 + 가점 1점)</div>

      <div className="grid grid-cols-2 gap-4">

        {/* ① 재학중인 학교 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              ① 재학중인 학교 <Badge variant="info" className="text-[10px]">최대 40점</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-2 py-1.5 rounded-tl font-medium">구분</th>
                  <th className="text-center px-2 py-1.5 rounded-tr font-medium">배점</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { grade: "초등학생", score: 40 },
                  { grade: "중학생",   score: 40 },
                  { grade: "고등학생", score: 40 },
                  { grade: "대학생",   score: 35 },
                ].map((row) => (
                  <tr key={row.grade} className="border-t">
                    <td className="px-2 py-1.5 text-slate-700">{row.grade}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-blue-600">{row.score}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ② 부(모) 복무기간 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              ② 부(모) 복무기간 <Badge variant="success" className="text-[10px]">최대 40점</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-2 py-1.5 rounded-tl font-medium">복무기간</th>
                  <th className="text-center px-2 py-1.5 rounded-tr font-medium">배점</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { range: "35년 이상",  score: "40.0점" },
                  { range: "30년",       score: "39.0점" },
                  { range: "25년",       score: "38.0점" },
                  { range: "20년",       score: "37.0점" },
                  { range: "10년",       score: "35.0점" },
                  { range: "1년",        score: "32.2점" },
                ].map((row) => (
                  <tr key={row.range} className="border-t">
                    <td className="px-2 py-1.5 text-slate-700">{row.range}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-emerald-600">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-2 px-1">
              ※ 35년 = 40점, 1년 미달마다 0.2점 차감 (임관일 기준 현역 복무기간 합산)
            </p>
          </CardContent>
        </Card>

        {/* ③④ 거리 배점 */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              ③ 시외 학생 주소지 · ④ 시외 부(모) 근무지역
              <Badge variant="warning" className="text-[10px]">각 최대 10점</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-3 py-1.5 rounded-tl font-medium">거리 기준 (기숙사 소재지 기준 직선거리)</th>
                  <th className="text-center px-3 py-1.5 rounded-tr font-medium">배점 (③ · ④ 동일 적용)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { range: "기숙사 소재 시(市) 내 거주/근무",   score: 0,  note: "시내 거주·근무 시 0점 처리" },
                  { range: "시외 거주·근무 / 50km 미만",        score: 5,  note: "" },
                  { range: "시외 거주·근무 / 50km 이상 ~ 60km 미만", score: 6, note: "" },
                  { range: "시외 거주·근무 / 60km 이상 ~ 70km 미만", score: 7, note: "" },
                  { range: "시외 거주·근무 / 70km 이상 ~ 80km 미만", score: 8, note: "" },
                  { range: "시외 거주·근무 / 80km 이상 ~ 90km 미만", score: 9, note: "" },
                  { range: "시외 거주·근무 / 90km 이상",         score: 10, note: "최대 배점" },
                ].map((row) => (
                  <tr key={row.range} className="border-t">
                    <td className="px-3 py-1.5 text-slate-700">
                      {row.range}
                      {row.note && <span className="ml-1 text-slate-400">({row.note})</span>}
                    </td>
                    <td className={`px-3 py-1.5 text-center font-bold ${row.score === 0 ? "text-slate-400" : row.score === 10 ? "text-orange-600" : "text-amber-600"}`}>
                      {row.score}점
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ⑤ 가점 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-500" />
              ⑤ 가점 <Badge variant="secondary" className="text-[10px]">+1점 (중복 미적용)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-2 py-1.5 font-medium">구분</th>
                  <th className="text-center px-2 py-1.5 font-medium">가점</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "세자녀 이상 부양가구",
                  "다문화 가정",
                  "한부모 가정",
                ].map((label) => (
                  <tr key={label} className="border-t">
                    <td className="px-2 py-1.5 text-slate-700">{label}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-purple-600">+1점</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-2 px-1">
              ※ 해당 항목이 복수일 경우에도 1점만 가산
            </p>
          </CardContent>
        </Card>

        {/* 동점자 우선순위 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              동점자 우선순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5 text-xs">
              {[
                "부(모) 복무기간",
                "시외 학생 주소지 거리",
                "시외 부(모) 근무지역 거리",
                "임용(임관)일",
                "군 번",
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* 제출서류 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-500" />
            제출서류 (신청자 → 등기우편 제출)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: "①", name: "입사신청서",      note: "기관 양식 / 서명" },
              { num: "②", name: "주민등록등본",     note: "3개월 이내 발급" },
              { num: "③", name: "현역복무확인서",   note: "소속 부대 인사담당" },
              { num: "④", name: "학생 증명사진",    note: "3×4cm / 3개월 이내" },
              { num: "⑤", name: "학생 건강진단서",  note: "전염성 질환 없음" },
            ].map((doc) => (
              <div key={doc.num} className="bg-slate-50 rounded-lg p-2.5 border text-center">
                <span className="text-[10px] font-bold text-blue-600">{doc.num}</span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-tight">{doc.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{doc.note}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            ※ 신청자는 국군복지포털(welfare.mil.kr)에서 온라인 접수 후, 서류를 해당 기숙사로 등기우편으로 발송
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
