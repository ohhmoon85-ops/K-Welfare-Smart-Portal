import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── OCR 추출 결과 타입 ───────────────────────────────────────────────────────
export interface VendorOcrResult {
  // 공통
  name?: string;            // 업체명 / 상호
  businessRegNumber?: string; // 사업자등록번호

  // PX/BX
  subCategory?: string;     // 소분류명
  vendorType?: "일반" | "경쟁과열";
  qualificationScore?: number; // 적격심사 점수
  discountRate?: number;       // 할인율(%)

  // WA-mall
  productCategory?: string; // 대분류 카테고리
  vendorSaleType?: "직접제조판매" | "OEM" | "수입" | "판매대행";
  marketLowestPrice?: number; // 시중 최저가(원)
  requestedPrice?: number;    // 판매 요청가(원)

  confidence: "high" | "medium" | "low";
  source: "claude-vision" | "mock";
  extractedFields: string[];
}

// ─── Claude Vision 프롬프트 ──────────────────────────────────────────────────
const EXTRACT_PROMPT = `
당신은 국군복지단 PX/BX 또는 WA-mall 업체 선정 서류를 분석하는 AI입니다.
아래 이미지(입찰참가신청서, 사업자등록증, POS 영수증, WA-mall 신청서 등)에서 다음 정보를 JSON으로 추출하세요.
존재하지 않는 필드는 null로 반환하세요.

반환 JSON 스키마:
{
  "name": "업체명 또는 상호명",
  "businessRegNumber": "사업자등록번호 (xxx-xx-xxxxx 형식)",
  "subCategory": "소분류명 (예: 과자류, 음료류, 스킨케어 등)",
  "vendorType": "일반 또는 경쟁과열 중 하나 (PX/BX)",
  "qualificationScore": 적격심사 점수 숫자 (0~100),
  "discountRate": 할인율 숫자 (%, 예: 5.5),
  "productCategory": "대분류 카테고리 (WA-mall, 예: 화장품, 식품 등)",
  "vendorSaleType": "직접제조판매 또는 OEM 또는 수입 또는 판매대행 중 하나",
  "marketLowestPrice": 시중 최저가 숫자 (원, 예: 15000),
  "requestedPrice": 복지단 판매 요청가 숫자 (원, 예: 12000)
}

JSON만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.
`;

// ─── Mock 데이터 ──────────────────────────────────────────────────────────────
function getMockPxResult(): VendorOcrResult {
  return {
    name: "(주)맛나식품",
    businessRegNumber: "123-45-67890",
    subCategory: "과자류",
    vendorType: "일반",
    qualificationScore: 85.5,
    discountRate: 8.0,
    confidence: "low",
    source: "mock",
    extractedFields: ["name", "businessRegNumber", "subCategory", "vendorType", "qualificationScore", "discountRate"],
  };
}

function getMockWaResult(): VendorOcrResult {
  return {
    name: "(주)뷰티라인",
    businessRegNumber: "234-56-78901",
    productCategory: "화장품",
    subCategory: "스킨케어",
    vendorSaleType: "직접제조판매",
    marketLowestPrice: 25000,
    requestedPrice: 22000,
    confidence: "low",
    source: "mock",
    extractedFields: ["name", "businessRegNumber", "productCategory", "subCategory", "vendorSaleType", "marketLowestPrice", "requestedPrice"],
  };
}

// ─── POST /api/ocr/vendor ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const channel = (formData.get("channel") as string) || "PX/BX";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // API 키 없으면 Mock 반환
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const mock = channel === "WA-mall" ? getMockWaResult() : getMockPxResult();
      return NextResponse.json({
        ...mock,
        warning: "ANTHROPIC_API_KEY 미설정 — Mock 데이터를 반환합니다. .env.local에 키를 추가하면 실제 OCR이 활성화됩니다.",
      });
    }

    // ── Claude Vision API 호출 ──
    const client = new Anthropic({ apiKey });
    const imageContents: Anthropic.ImageBlockParam[] = [];

    for (const file of files.slice(0, 4)) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mediaType = (file.type || "image/jpeg") as Anthropic.Base64ImageSource["media_type"];

      if ((mediaType as string) === "application/pdf") continue;

      imageContents.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    if (imageContents.length === 0) {
      const mock = channel === "WA-mall" ? getMockWaResult() : getMockPxResult();
      return NextResponse.json({
        ...mock,
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
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const extractedFields = Object.entries(parsed)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k]) => k);

    const result: VendorOcrResult = {
      name:               parsed.name               ?? undefined,
      businessRegNumber:  parsed.businessRegNumber  ?? undefined,
      subCategory:        parsed.subCategory        ?? undefined,
      vendorType:         parsed.vendorType         ?? undefined,
      qualificationScore: parsed.qualificationScore ?? undefined,
      discountRate:       parsed.discountRate       ?? undefined,
      productCategory:    parsed.productCategory    ?? undefined,
      vendorSaleType:     parsed.vendorSaleType     ?? undefined,
      marketLowestPrice:  parsed.marketLowestPrice  ?? undefined,
      requestedPrice:     parsed.requestedPrice     ?? undefined,
      confidence: extractedFields.length >= 5 ? "high" : extractedFields.length >= 3 ? "medium" : "low",
      source: "claude-vision",
      extractedFields,
    };

    return NextResponse.json(result);

  } catch (err) {
    console.error("[Vendor OCR API Error]", err);
    return NextResponse.json({ error: "OCR 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
