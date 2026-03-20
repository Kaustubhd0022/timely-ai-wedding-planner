import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, history, weddingId } = await request.json();

    if (!weddingId) {
      return NextResponse.json({ error: "Missing weddingId" }, { status: 400 });
    }

    // Fetch wedding context
    const { data: wedding } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", weddingId)
      .single();

    const weddingDate = wedding?.wedding_date ? new Date(wedding.wedding_date).toDateString() : "Not set";
    const city = wedding?.city || "Not set";
    const budget = wedding?.total_budget || "Not set";
    const guestCount = wedding?.guest_count || "Not set";

    // Format history for Groq
    const formattedHistory = history.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Saathi'}: ${msg.content}`).join("\n");

    const systemPrompt = `You are Saathi AI, a smart wedding planning assistant.
You are not a chatbot. You are an intelligent planner.

You have access to:
Wedding details:
- Date: ${weddingDate}
- City: ${city}
- Budget: ${budget}
- Guests: ${guestCount}

Conversation history:
${formattedHistory}

Your job:
1. Understand user intent
2. Maintain context
3. Help plan the wedding
4. Suggest next steps proactively

You can:
- Update events
- Create tasks
- Suggest vendors
- Adjust timelines

IMPORTANT:
Always return JSON:
{
  "reply": "natural human response",
  "action": "action_name OR null",
  "data": {}
}

Be warm, helpful, and calm.

Examples:
User: "Move it to next week"
-> Understand previous context
User: "What should I do now?"
-> Suggest next task based on timeline
User: "I am stressed"
-> Respond emotionally + guide
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    
    // Attempt to parse JSON response
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiResponse);
    } catch (err) {
      console.error("Failed to parse AI JSON:", aiResponse);
      jsonResponse = {
        reply: "I am here to help, but I had trouble understanding that. Could you clarify?",
        action: null,
        data: {}
      };
    }

    return NextResponse.json({
      reply: jsonResponse.reply,
      action: jsonResponse.action,
      data: jsonResponse.data
    });

  } catch (error: any) {
    console.error("Saathi Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
