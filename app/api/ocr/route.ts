import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── OCR 추출 결과 타입 ───────────────────────────────────────────────────────
export interface OcrResult {
  // 입사신청서 / 현역복무확인서 / 주민등록등본에서 추출
  studentName?: string;
  school?: string;
  schoolLevel?: "초등학생" | "중학생" | "고등학생" | "대학생";
  parentUnit?: string;
  parentRank?: string;
  serviceYears?: number;       // 임관일 → 현재 기준 복무기간(년)
  isMultiChild?: boolean;      // 주민등록등본: 자녀 3명 이상
  isSingleParent?: boolean;    // 주민등록등본: 한부모 가정
  isMulticultural?: boolean;   // 주민등록등본: 다문화 가정
  confidence: "high" | "medium" | "low";
  source: "claude-vision" | "mock";
  extractedFields: string[];   // 실제로 읽은 필드 목록
}

// ─── Claude Vision 프롬프트 ──────────────────────────────────────────────────
const EXTRACT_PROMPT = `
당신은 국군복지단 기숙사 입사 신청 서류를 분석하는 AI입니다.
아래 이미지에서 다음 정보를 JSON으로 추출하세요.
존재하지 않는 필드는 null로 반환하세요.

반환 JSON 스키마:
{
  "studentName": "학생 이름 (입사신청서)",
  "school": "재학 학교명 (입사신청서)",
  "schoolLevel": "초등학생 | 중학생 | 고등학생 | 대학생 중 하나",
  "parentUnit": "부(모) 소속 부대명",
  "parentRank": "부(모) 계급",
  "commissionDate": "임관일 (YYYY-MM-DD 형식, 현역복무확인서)",
  "isMultiChild": true/false (주민등록등본에서 자녀 3명 이상 여부),
  "isSingleParent": true/false (한부모 가정 여부),
  "isMulticultural": true/false (다문화 가정 여부)
}

JSON만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.
`;

// ─── 임관일 → 복무기간(년) 계산 ─────────────────────────────────────────────
function calcServiceYearsFromDate(commissionDate: string): number {
  const commission = new Date(commissionDate);
  const now = new Date();
  const diffMs = now.getTime() - commission.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
}

// ─── Mock 데이터 (API 키 없을 때) ────────────────────────────────────────────
function getMockResult(): OcrResult {
  return {
    studentName: "김민준",
    school: "육군부사관학교부설고등학교",
    schoolLevel: "고등학생",
    parentUnit: "육군 제2작전사령부",
    parentRank: "중령",
    serviceYears: 24.5,
    isMultiChild: false,
    isSingleParent: false,
    isMulticultural: false,
    confidence: "low",
    source: "mock",
    extractedFields: ["studentName", "school", "schoolLevel", "parentUnit", "parentRank", "serviceYears"],
  };
}

// ─── POST /api/ocr ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // API 키 없으면 Mock 반환
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ...getMockResult(),
        warning: "ANTHROPIC_API_KEY 미설정 — Mock 데이터를 반환합니다. .env.local에 키를 추가하면 실제 OCR이 활성화됩니다.",
      });
    }

    // ── Claude Vision API 호출 ──
    const client = new Anthropic({ apiKey });
    const imageContents: Anthropic.ImageBlockParam[] = [];

    for (const file of files.slice(0, 3)) { // 최대 3개 파일 처리 (비용 절감)
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mediaType = (file.type || "image/jpeg") as Anthropic.Base64ImageSource["media_type"];

      // PDF는 첫 페이지 이미지로 처리 (지원 미디어타입: jpeg, png, gif, webp)
      if ((mediaType as string) === "application/pdf") continue;

      imageContents.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    if (imageContents.length === 0) {
      // PDF만 업로드된 경우 mock 반환
      return NextResponse.json({
        ...getMockResult(),
        warning: "PDF 형식은 이미지 변환 후 OCR이 가능합니다. JPG/PNG로 스캔하시면 자동 추출됩니다.",
      });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text", text: EXTRACT_PROMPT },
          ],
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    // JSON 파싱 (코드블록 제거)
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // 임관일 → 복무기간 변환
    const serviceYears = parsed.commissionDate
      ? calcServiceYearsFromDate(parsed.commissionDate)
      : undefined;

    const extractedFields = Object.entries(parsed)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k]) => k === "commissionDate" ? "serviceYears" : k);

    const result: OcrResult = {
      studentName:     parsed.studentName     ?? undefined,
      school:          parsed.school          ?? undefined,
      schoolLevel:     parsed.schoolLevel     ?? undefined,
      parentUnit:      parsed.parentUnit      ?? undefined,
      parentRank:      parsed.parentRank      ?? undefined,
      serviceYears:    serviceYears,
      isMultiChild:    parsed.isMultiChild    ?? undefined,
      isSingleParent:  parsed.isSingleParent  ?? undefined,
      isMulticultural: parsed.isMulticultural ?? undefined,
      confidence: extractedFields.length >= 5 ? "high" : extractedFields.length >= 3 ? "medium" : "low",
      source: "claude-vision",
      extractedFields,
    };

    return NextResponse.json(result);

  } catch (err) {
    console.error("[OCR API Error]", err);
    return NextResponse.json({ error: "OCR 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
