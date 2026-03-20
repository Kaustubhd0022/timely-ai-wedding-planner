import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getWeddingContext, generateWhatsAppMessage, sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("API triggered: /api/whatsapp/trigger");
  try {
    const { searchParams } = new URL(request.url);
    const wedding_id = searchParams.get("wedding_id");
    const type = searchParams.get("type") as "daily" | "weekly" | "overdue" | "dependency_unlock";
    const extra_info = searchParams.get("extra_info") || undefined;

    if (!wedding_id || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Fetch wedding to check opt-in
    const { data: wedding, error } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", wedding_id)
      .single();

    if (error || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    // 2. Safety & UX Rules: Never send message without opt-in
    if (!wedding.whatsapp_opt_in || !wedding.whatsapp_number) {
      return NextResponse.json({ skipped: true, reason: "User has not opted in to WhatsApp messages." }, { status: 200 });
    }

    // Add quiet hours basic check (Server local time)
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour <= 8) {
      return NextResponse.json({ skipped: true, reason: "Quiet hours block (10 PM - 8 AM)." }, { status: 200 });
    }

    // Rate limiting: Do not send more than 1 per day if simple implementation, unless it's a critical alert
    // In full production, we'd check `last_message_sent_at` and limit.

    // 3. Get context
    const context = await getWeddingContext(wedding_id);
    if (!context) {
      return NextResponse.json({ error: "Context could not be generated" }, { status: 500 });
    }

    // 4. Generate AI Message
    const generatedMessage = await generateWhatsAppMessage(type, context, extra_info);

    // 5. Send message (Mock)
    await sendWhatsAppMessage(wedding.whatsapp_number, generatedMessage);

    // 6. Update database
    await supabase.from("weddings").update({
      last_message_sent_at: new Date().toISOString()
    }).eq("id", wedding_id);

    return NextResponse.json({ 
      success: true, 
      sent_to: wedding.whatsapp_number,
      message_type: type,
      content: generatedMessage
    }, { status: 200 });

  } catch (err: any) {
    console.error("WhatsApp Trigger API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
