import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("API triggered: /api/ai/daily-plan");
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ plans: [] });
    }
    const { tasks } = await req.json();

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ plans: [] });
    }

    const prompt = `You are a professional wedding planner assistant.
Given the following top 3 upcoming tasks for a wedding:
${tasks.map((t: any, i: number) => `${i + 1}. ${t.name} (Deadline: ${t.deadline_date}, Priority: ${t.priority})`).join("\n")}

Generate a JSON object with a 'plans' array. Each element should correspond to a task and contain:
1. 'task_id': the ID of the task
2. 'explanation': A short (1 sentence), actionable, and encouraging explanation of why this task matters today.

Output ONLY valid JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Daily Plan Error:", error);
    return NextResponse.json({ error: "Failed to generate AI plan" }, { status: 500 });
  }
}
