import OpenAI from "openai";
import { Lunar, Solar } from "lunar-javascript";

type Input = {
  birthDate?: string;
  birthTime?: string;
  calendarType?: "solar" | "lunar";
  gender?: string;
  unknownTime?: boolean;
  privacy?: boolean;
};

const attempts = new Map<string, { count: number; reset: number }>();
const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://commerce-store.cmsuk93.chatgpt.site";

function cors(origin: string | null) {
  return {
    "access-control-allow-origin": origin === allowedOrigin ? origin : allowedOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return Response.json(body, { status, headers: cors(origin) });
}

function pillarsFor(input: Input) {
  const [year, month, day] = input.birthDate!.split("-").map(Number);
  const [hour, minute] = (input.birthTime || "12:00").split(":").map(Number);
  let solar;
  if (input.calendarType === "lunar") {
    const converted = Lunar.fromYmd(year, month, day).getSolar();
    solar = Solar.fromYmdHms(
      converted.getYear(),
      converted.getMonth(),
      converted.getDay(),
      hour,
      minute,
      0,
    );
  } else {
    solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  }
  const eight = solar.getLunar().getEightChar();
  return {
    year: eight.getYear(),
    month: eight.getMonth(),
    day: eight.getDay(),
    ...(input.unknownTime ? {} : { time: eight.getTime() }),
  };
}

export default async function handler(request: Request) {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== "POST") return json({ message: "지원하지 않는 요청입니다." }, 405, origin);
  if (origin && origin !== allowedOrigin) return json({ message: "허용되지 않은 요청입니다." }, 403, origin);

  try {
    const input = (await request.json()) as Input;
    if (!input.privacy || !input.birthDate || !input.gender || !input.calendarType || (!input.unknownTime && !input.birthTime)) {
      return json({ message: "생년월일시와 성별을 모두 확인해 주세요." }, 400, origin);
    }
    if (!["여성", "남성"].includes(input.gender) || !["solar", "lunar"].includes(input.calendarType)) {
      return json({ message: "입력 형식을 확인해 주세요." }, 400, origin);
    }

    const born = new Date(`${input.birthDate}T00:00:00+09:00`);
    if (!Number.isFinite(born.getTime()) || born > new Date()) {
      return json({ message: "올바른 생년월일을 입력해 주세요." }, 400, origin);
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const record = attempts.get(ip);
    if (record && record.reset > now && record.count >= 5) {
      return json({ message: "무료 분석을 여러 번 요청하셨어요. 한 시간 뒤 다시 이용해 주세요." }, 429, origin);
    }
    attempts.set(ip, {
      count: record && record.reset > now ? record.count + 1 : 1,
      reset: record && record.reset > now ? record.reset : now + 3_600_000,
    });

    if (!process.env.OPENAI_API_KEY) return json({ message: "무료 분석 기능을 준비하고 있어요." }, 503, origin);

    const pillars = pillarsFor(input);
    const age = Math.max(0, Math.floor((Date.now() - born.getTime()) / 31_557_600_000));
    const ageGroup = age <= 3 ? "영유아" : age <= 6 ? "유아" : age <= 9 ? "초등 저학년" : age <= 12 ? "초등 고학년" : "중고등";
    const prompt = `사주서가 자녀 기질 분석을 생성합니다. 입력은 ${input.calendarType === "lunar" ? "음력" : "양력"} ${input.birthDate}, ${input.unknownTime ? "출생 시간 모름" : input.birthTime}, ${input.gender}, 만 ${age}세 ${ageGroup}, 연주 ${pillars.year}, 월주 ${pillars.month}, 일주 ${pillars.day}${pillars.time ? `, 시주 ${pillars.time}` : ""}입니다. 이름은 받지 않았으므로 헤더에는 우리 아이를 씁니다. 무료는 현재 기질, 현재 관찰 행동, 오늘 팁 하나만 다룹니다. 미래 시기, 전체 학습 및 양육 전략, 부모 궁합은 분석하지 말고 ⑤에서 유료 범위로만 소개합니다. 각 챕터는 제목 포함 1000자 이하, 제목 다음 한 줄 본문, 빈 줄 없이 씁니다. 쌍따옴표, 가운뎃점, 한자, 본문 불릿을 쓰지 않고 습니다체와 비단정 표현을 씁니다. 아이는 이 아이로 부릅니다. ① 타고난 기질은 일주 구조의 사주 용어를 한 번만 쓰고 평이하게 번역하며 핵심 축 두 개와 겉과 속 대비로 마칩니다. ② 부모님 눈에 이미 보이고 있을 장면은 ${ageGroup}에게 관찰되는 구체적 장면 두 개를 훈육, 또래 관계, 새 환경 중 서로 다른 영역에서 제시하고 마지막에 한 번만 확인 질문을 씁니다. ③ 이 아이의 에너지가 꺾이는 순간은 상황 하나만 죄책감 없이 설명합니다. ④ 오늘부터 바로 쓸 수 있는 팁 하나는 오늘 가능한 팁 정확히 하나와 이유를 씁니다. ⑤ 앞으로의 흐름이 궁금하시다면 현재 기질까지만 봤음을 알리고 유료 범위인 연령대별 흐름, 학습과 양육 가이드, 부모와 아이의 궁합과 대화법을 소개합니다. 상품은 12페이지 자녀 기질 분석 및 양육 가이드, 45,000원입니다. 할인이나 상담 시간은 쓰지 않습니다. 의료 또는 심리 진단처럼 표현하지 않습니다.`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      store: false,
      input: [
        { role: "system", content: "주어진 사주 네 기둥으로 한국어 자녀 기질 분석만 생성합니다." },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "child_temperament",
          strict: true,
          schema: {
            type: "object",
            properties: {
              header: { type: "string" }, chapter1: { type: "string" }, chapter2: { type: "string" },
              chapter3: { type: "string" }, chapter4: { type: "string" }, chapter5: { type: "string" },
            },
            required: ["header", "chapter1", "chapter2", "chapter3", "chapter4", "chapter5"],
            additionalProperties: false,
          },
        },
      },
    });
    if (!response.output_text) throw new Error("empty output");
    const analysis = JSON.parse(response.output_text);
    for (const key of ["chapter1", "chapter2", "chapter3", "chapter4", "chapter5"]) {
      if (typeof analysis[key] !== "string" || analysis[key].length > 1000) throw new Error("invalid format");
    }
    return json({ ...analysis, pillars }, 200, origin);
  } catch (error) {
    console.error("temperament analysis failed", error);
    return json({ message: "분석 중 잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요." }, 500, origin);
  }
}
