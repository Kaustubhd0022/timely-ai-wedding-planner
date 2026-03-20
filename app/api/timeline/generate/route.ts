import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      wedding_date, 
      guest_count, 
      budget_range, 
      cultural_context, 
      events_selected,
      groom_name,
      bride_name,
      groom_whatsapp,
      bride_whatsapp,
      user_city
    } = body;

    // 1. Generate Content with AI (Groq)
    const prompt = `
      You are an expert wedding planner specializing in Indian weddings. 
      Generate a detailed planning timeline for a wedding with the following details:
      - Date: ${wedding_date}
      - Guest Count: ${guest_count}
      - Budget Range: ${budget_range}
      - Culture: ${cultural_context}
      - Selected Events: ${events_selected.join(", ")}

      Return a JSON object with:
      1. "tasks": An array of at least 50 tasks. Each task should have:
         - "name": Detailed name (e.g., "Book Mehendi Artist for Bride")
         - "category": (Venue, Catering, Clothing, Photography, Decor, Invitations, Rituals, Logistics)
         - "event_type": (All, or one of the selected events)
         - "weeks_before": Integer (0 to 52)
         - "priority": Integer (1-5, 1 is highest)
         - "depends_on": An array of EXACT task names from THIS list that MUST be completed before this task (e.g., "Book Catering" depends on "Finalize Venue").
      2. "budget_allocations": An array of major expense categories.
      3. "suggested_guest_groups": An array of strings.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
    const aiTasks = aiResponse.tasks || [];
    const budgetAllocations = aiResponse.budget_allocations || [];
    const suggestedGroups = aiResponse.suggested_guest_groups || [];

    // 2. Map budget range to a numeric value
    const budgetMap: Record<string, number> = {
      "Under 10L": 800000,
      "10-25L": 1800000,
      "25-50L": 3500000,
      "50L-1Cr": 7500000,
      "Above 1Cr": 15000000
    };
    const totalBudget = budgetMap[budget_range] || 1000000;

    // 3. Create Wedding Record
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .insert({
        wedding_date,
        guest_count,
        budget_range,
        cultural_context,
        events_selected,
        groom_name,
        bride_name,
        groom_whatsapp,
        bride_whatsapp,
        user_city,
        total_budget: totalBudget,
        session_token: crypto.randomUUID(), 
      })
      .select()
      .single();

    if (weddingError) throw weddingError;

    // 4. Batch Insert Tasks
    let insertedTasks: any[] = [];
    if (aiTasks.length > 0) {
      const weddingDateObj = new Date(wedding_date);
      const tasksToInsert = aiTasks.map((t: any) => {
        const deadline = new Date(weddingDateObj);
        deadline.setDate(deadline.getDate() - (t.weeks_before * 7));
        
        return {
          wedding_id: wedding.id,
          name: t.name,
          category: t.category,
          event_type: t.event_type || 'All',
          deadline_date: deadline.toISOString().split('T')[0],
          priority: t.priority || 3,
          status: 'Todo'
        };
      });
      const { data, error } = await supabase.from("tasks").insert(tasksToInsert).select();
      if (error) throw error;
      insertedTasks = data || [];
    }

    // 5. Handle Dependencies
    const taskMap = new Map(insertedTasks.map(t => [t.name, t.id]));
    const dependenciesToInsert = [];

    for (const aiTask of aiTasks) {
      if (aiTask.depends_on && Array.isArray(aiTask.depends_on)) {
        const taskId = taskMap.get(aiTask.name);
        for (const depName of aiTask.depends_on) {
          const depId = taskMap.get(depName);
          if (taskId && depId) {
            dependenciesToInsert.push({
              task_id: taskId,
              depends_on_id: depId
            });
          }
        }
      }
    }

    if (dependenciesToInsert.length > 0) {
      await supabase.from("task_dependencies").insert(dependenciesToInsert);
    }

    // 6. Insert Budget Allocations
    if (budgetAllocations.length > 0) {
      const budgetsToInsert = budgetAllocations.map((b: any) => ({
        wedding_id: wedding.id,
        category: b.category,
        estimated_amount: (b.estimated_percentage / 100) * totalBudget,
        actual_amount: 0,
        paid_amount: 0,
        status: "Pending"
      }));
      await supabase.from("budgets").insert(budgetsToInsert);
    }

    // 7. Insert Initial Guest Groups
    if (suggestedGroups.length > 0) {
      const guestsToInsert = suggestedGroups.slice(0, 5).map((g: string) => ({
        wedding_id: wedding.id,
        first_name: "Group",
        last_name: g,
        group_tag: g,
        rsvp_status: "Pending"
      }));
      await supabase.from("guests").insert(guestsToInsert);
    }

    return NextResponse.json({ 
      success: true, 
      wedding_id: wedding.id 
    });

  } catch (error: any) {
    console.error("Timeline Generation Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
