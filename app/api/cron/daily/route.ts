import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  // 1. Security Check (Prevent hackers from triggering your email blast)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Logic: Find customers visited yesterday (for Reviews)
  // In SQL, we calculate "Yesterday"
  const { data: reviewCandidates, error } = await supabaseAdmin
    .from("customers")
    .select(
      `
      *,
      integrations!inner(access_token, refresh_token, email_from)
    `,
    )
    .eq(
      "last_visit_date",
      new Date(Date.now() - 86400000).toISOString().split("T")[0],
    ); // Yesterday
  // .is('email_logs', null) // You'd add logic here to ensure we haven't sent already

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Loop and Send
  const results = [];

  for (const customer of reviewCandidates || []) {
    // TODO: HERE IS WHERE YOU CALL GMAIL API
    // await refreshGoogleToken(customer.integrations.refresh_token)...
    // await sendGmail(...)

    // Log it
    await supabaseAdmin.from("email_logs").insert({
      customer_id: customer.id,
      email_type: "review",
      status: "sent",
    });

    results.push(`Sent review email to ${customer.email}`);
  }

  return NextResponse.json({ success: true, processed: results.length });
}
