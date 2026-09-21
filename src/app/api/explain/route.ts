import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { staticExplain, ANATOMY } from "@/game/data/anatomy";

/**
 * Qwen educational explanation endpoint (spec section 20).
 * Server-side only. Validated output, static fallback: the game stays fully
 * playable without the AI.
 */

interface ExplainBody {
  organ?: string;
  event?: string;
  difficulty?: "beginner" | "curious" | "advanced";
  context?: string;
}

const VALID_DIFFICULTY = new Set(["beginner", "curious", "advanced"]);

interface ValidatedExplanation {
  title?: string;
  explanation?: string;
  funFact?: string;
  missionTip?: string;
  keywords?: string[];
}

function validate(raw: unknown): ValidatedExplanation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: ValidatedExplanation = {};
  if (typeof r.title === "string" && r.title.length > 0 && r.title.length < 80) out.title = r.title;
  if (typeof r.explanation === "string" && r.explanation.length > 40 && r.explanation.length < 900) out.explanation = r.explanation;
  if (typeof r.funFact === "string" && r.funFact.length > 10 && r.funFact.length < 400) out.funFact = r.funFact;
  if (typeof r.missionTip === "string" && r.missionTip.length > 10 && r.missionTip.length < 400) out.missionTip = r.missionTip;
  if (Array.isArray(r.keywords)) {
    const kw = r.keywords.filter((k) => typeof k === "string" && k.length < 40).slice(0, 6);
    if (kw.length > 0) out.keywords = kw as string[];
  }
  return out.explanation ? out : null;
}

export async function POST(req: NextRequest) {
  let body: ExplainBody;
  try {
    body = (await req.json()) as ExplainBody;
  } catch {
    return NextResponse.json(staticExplain("coronaryArtery"));
  }

  const organ = typeof body.organ === "string" ? body.organ : "coronary artery";
  const difficulty =
    body.difficulty && VALID_DIFFICULTY.has(body.difficulty) ? body.difficulty : "beginner";

  const fallback = staticExplain(organ);

  try {
    const zai = await ZAI.create();
    const known = Object.values(ANATOMY).find((a) => a.organ.toLowerCase() === organ.toLowerCase());
    const prompt = `You are the anatomy educator for "Anatomy Arcade", a science game where a medical nano-robot travels inside the human body during a heart-attack emergency response.

The player just scanned: ${organ}
Game context: ${body.context ?? "heart_attack_response"}
Event: ${body.event ?? "player_scanned_structure"}
Reading level: ${difficulty}

Rules:
- Be scientifically accurate and responsible. This is education, not medical advice.
- No em-dash characters anywhere. Use commas, colons or periods instead.
- explanation: 2 to 4 short sentences (max 60 words), vivid, precise.
- missionTip: 1 sentence connecting the anatomy to the gameplay.
- funFact: 1 surprising but true sentence.
- keywords: 3 or 4 single words.
${known ? `Ground truth from our educators (stay consistent with it): ${known.body}` : ""}

Respond with ONLY this JSON object, no markdown fences:
{"title": "...", "explanation": "...", "funFact": "...", "missionTip": "...", "keywords": ["...", "..."]}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise science educator. Output strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 350,
    });

    const text = completion?.choices?.[0]?.message?.content ?? "";
    const jsonText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const parsed = validate(JSON.parse(jsonText.slice(start, end + 1)));
      if (parsed) {
        return NextResponse.json({
          title: parsed.title ?? fallback.title,
          explanation: parsed.explanation ?? fallback.explanation,
          funFact: parsed.funFact ?? fallback.funFact,
          missionTip: parsed.missionTip ?? fallback.missionTip,
          keywords: parsed.keywords ?? fallback.keywords,
          viaAI: true,
        });
      }
    }
    return NextResponse.json(fallback);
  } catch {
    return NextResponse.json(fallback);
  }
}
