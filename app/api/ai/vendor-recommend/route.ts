import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("API triggered: /api/ai/vendor-recommend");
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ recommendation: "This vendor is a highly recommended choice for their quality and service." });
    }
    const { vendor } = await req.json();

    const prompt = `You are a wedding expert.
Explain why this vendor is a good choice for a wedding based on their details:
Name: ${vendor.name}
Category: ${vendor.category}
Rating: ${vendor.rating}
Location: ${vendor.address}

Generate a short (max 20 words), trust-building, and specific recommendation. 
Output ONLY the sentence.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
    });

    const recommendation = completion.choices[0]?.message?.content?.trim();
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("AI Vendor Recommend Error:", error);
    return NextResponse.json({ error: "Failed to generate recommendation" }, { status: 500 });
  }
}
