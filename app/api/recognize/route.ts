import { GoogleGenAI, ApiError } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface IdentifiedItem {
  item: string;
  material: string;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function parseItems(raw: string): IdentifiedItem[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o: unknown) =>
        typeof o === "object" && o !== null && "item" in o && "material" in o,
    ) as IdentifiedItem[];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    let response;
    let retries = 3;

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: imageFile.type,
                    data: base64,
                  },
                },
                {
                  text: `You are an expert jewelry and ornament identification specialist. Analyze the image carefully and identify ONLY the main jewelry items visible in the image along with their most likely material.

Rules:
- Return only top-level jewelry categories.
- Do NOT include parts or attachments of another jewelry item.
- Example: if a necklace has a pendant, return only "necklace".
- If earrings contain charms or gemstones, return only "earrings".
- Avoid duplicate or nested jewelry names.
- Detect likely material based on appearance such as:
  - gold
  - silver
  - platinum
  - diamond
  - pearl
  - gemstone
  - oxidized metal
  - artificial/fashion jewelry
  - mixed material
- Be visually inferential but concise.
- If material is uncertain, use "unknown".
- Return ONLY a JSON array of objects.
- Do not include explanations or extra text.
- If no jewelry is present, return [].

Output format:
[
  {
    "item": "necklace",
    "material": "gold"
  },
  {
    "item": "earrings",
    "material": "diamond"
  }
]`,
                },
              ],
            },
          ],
        });
        break;
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.status === 503 && retries > 1) {
            retries--;
            console.warn(`Server busy. Retrying... (${retries} attempts left)`);
            await delay(2000);
            continue;
          }
        }
        throw err;
      }
    }

    const raw = response?.text ?? "";
    const items = parseItems(raw);

    const usage = response?.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    const pricePerMillionInput = 0.15;
    const pricePerMillionOutput = 0.6;

    const inputCost = inputTokens * (pricePerMillionInput / 1_000_000);
    const outputCost = outputTokens * (pricePerMillionOutput / 1_000_000);
    const totalCostUSD = inputCost + outputCost;

    return NextResponse.json({
      items,
      cost: totalCostUSD,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Recognition failed";
    console.error("Recognition error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
