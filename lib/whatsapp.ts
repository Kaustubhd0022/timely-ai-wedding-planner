import { supabase } from "./supabase";
import { getNextBestAction } from "./orchestrator";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Mock WhatsApp Sending System
export async function sendWhatsAppMessage(phone: string, message: string) {
  // In production, you would call Meta Cloud API here:
  // await fetch('https://graph.facebook.com/v17.0/.../messages', { method: 'POST', body: ... })
  
  console.log(`\n============================`);
  console.log(`📱 MOCK WHATSAPP MESSAGE SENT`);
  console.log(`To: ${phone}`);
  console.log(`Message:\n${message}`);
  console.log(`============================\n`);
  
  return true;
}

export async function getWeddingContext(weddingId: string) {
  // Fetch wedding details
  const { data: wedding } = await supabase.from("weddings").select("*").eq("id", weddingId).single();
  
  // Fetch tasks
  const { data: tasks } = await supabase.from("tasks").select("*").eq("wedding_id", weddingId).order("deadline_date", { ascending: true });
  
  if (!wedding || !tasks) return null;

  // Fetch dependencies
  const { data: deps } = await supabase.from("task_dependencies").select("*").in("task_id", tasks.map(t => t.id));

  const now = new Date();
  
  // Analyze timeline
  const overdueTasks = tasks.filter(t => t.status !== "Done" && new Date(t.deadline_date) < now);
  const thisWeekTasks = tasks.filter(t => {
    if (t.status === "Done") return false;
    const deadline = new Date(t.deadline_date);
    const diffTime = Math.abs(deadline.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });
  
  const nextAction = getNextBestAction(tasks, deps || []);
  
  return {
    wedding_date: wedding.wedding_date,
    overdue_tasks: overdueTasks,
    this_week_tasks: thisWeekTasks,
    next_action: nextAction,
  };
}

export async function generateWhatsAppMessage(type: "weekly" | "daily" | "overdue" | "dependency_unlock", context: any, extraInfo?: string) {
  if (!groq) {
    // Fallback Mock System if API Key is missing
    return `Hi! Remember to check your wedding dashboard. You have ${context.overdue_tasks.length} overdue tasks and your next focus is: ${context.next_action?.task.name || 'reviewing your timeline'}.`;
  }
  
  const prompt = `
You are a friendly Indian wedding planner.
Write a short WhatsApp message for the couple.

MESSAGE TYPE: ${type}
${extraInfo ? `EXTRA CONTEXT: ${extraInfo}` : ''}

WEDDING CONTEXT:
- Wedding Date: ${context.wedding_date}
- Overdue Tasks: ${context.overdue_tasks.map((t: any) => t.name).join(", ")}
- Tasks Due This Week: ${context.this_week_tasks.map((t: any) => t.name).join(", ")}
- Top Priority Next Action: ${context.next_action?.task.name} (${context.next_action?.reason})

RULES:
- Max 60-80 words.
- Tone MUST BE friendly, polite, calm, and supportive (use emojis like 💍, 🎯, 🎉, ⚠️).
- Be actionable: reference the specific real tasks listed above.
- NEVER sound robotic. Avoid generic advice.
- End with a small nudge to check their dashboard.
`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768", // fast, good for short generations
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return response.choices[0]?.message?.content || "Check your dashboard for new updates!";
  } catch (err) {
    console.error("WhatsApp Generation Error:", err);
    return "Your wedding timeline has been updated! Please check the dashboard.";
  }
}
