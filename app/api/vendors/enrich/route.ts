import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface EnrichRequest {
  vendor: {
    name: string;
    category: string;
    rating: number;
    total_reviews: number;
    location: {
      lat: number;
      lng: number;
    };
    address: string;
  };
}

// In-memory cache for edge route (temporary, clears on cold start)
const enrichmentCache = new Map<string, any>();

export async function POST(req: Request) {
  console.log("API triggered: /api/vendors/enrich");
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("[ENRICH] Missing GROQ_API_KEY. Using fallback.");
      return NextResponse.json({
        description: "Premium wedding services tailored to your specialized needs.",
        why_choose: "Highly rated by couples for exceptional reliability and quality.",
        tagline: "Your Vision. Brought to Life.",
        fallback: true
      });
    }
    const body: EnrichRequest = await req.json();
    const { vendor } = body;

    if (!vendor || !vendor.name) {
      return NextResponse.json({ error: "Vendor data required" }, { status: 400 });
    }

    const cacheKey = `vendor-${vendor.name}-${vendor.address}`;
    if (enrichmentCache.has(cacheKey)) {
      return NextResponse.json(enrichmentCache.get(cacheKey));
    }

    const prompt = `You are a wedding expert.

Given vendor details:
* Name: ${vendor.name}
* Category: ${vendor.category}
* Rating: ${vendor.rating}
* Reviews: ${vendor.total_reviews}
* Address: ${vendor.address}

Generate exactly 3 things in JSON format.
1. "description": Short description (1 line)
2. "why_choose": Why choose this vendor (1 line)
3. "tagline": Tagline (catchy)

Rules:
* Keep it short
* Make it sound premium
* Avoid generic text
* Output exactly and only valid JSON with keys: "description", "why_choose", "tagline".`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 200,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      throw new Error("Failed to generate insights from AI");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    enrichmentCache.set(cacheKey, parsed);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Enrichment error:", error);
    // Fallback response if API fails
    return NextResponse.json({
      description: "Premium wedding services tailored to your specialized needs.",
      why_choose: "Highly rated by couples for exceptional reliability and quality.",
      tagline: "Your Vision. Brought to Life.",
      fallback: true
    });
  }
}
