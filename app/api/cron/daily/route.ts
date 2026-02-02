import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import jwt from "jsonwebtoken";
import { sendGmail } from "@/lib/google";
import { getTemplate, compileTemplate } from "@/lib/templates";

const SECRET = process.env.TRACKING_JWT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to calculate dates YYYY-MM-DD
const getDateStr = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const yesterday = getDateStr(1);
  const thirtyDaysAgo = getDateStr(30);

  console.log(
    `🤖 Cron Job Started. Checking for: ${yesterday} (Reviews) and ${thirtyDaysAgo} (Retention)`,
  );

  try {
    // 2. Fetch Candidates
    // We need tenant info to send the email (tokens) and generate the template
    const { data: candidates, error } = await supabase
      .from("customers")
      .select(
        `
        id, name, email, last_visit_date, status,
        tenants (
          id, business_name
        )
      `,
      )
      .or(`last_visit_date.eq.${yesterday},last_visit_date.eq.${thirtyDaysAgo}`)
      .neq("status", "reviewed"); // Don't bug people who already reviewed

    if (error) throw error;

    const results = [];

    // 3. Loop and Process
    for (const customer of candidates || []) {
      const tenant = customer.tenants as any;

      // Skip if orphan data
      if (!tenant) continue;

      let emailType: "review" | "retention" = "review";
      let destParam = "google";

      // --- LOGIC SPLIT ---
      if (customer.last_visit_date === yesterday) {
        // CASE A: REVIEW (1 Day Later)
        if (customer.status !== "pending") continue;
        emailType = "review";
        destParam = "google";
      } else {
        // CASE B: RETENTION (30 Days Later)
        emailType = "retention";
        destParam = "retention";
      }

      // 4. Prepare Dynamic Content
      // Fetch the custom template from DB
      const rawTemplate = await getTemplate(supabase, tenant.id, emailType);

      // Fill in variables {{name}}, {{business_name}}
      const template = compileTemplate(rawTemplate, {
        name: customer.name || "there",
        business_name: tenant.business_name,
      });

      // Generate Secure Tracking Link
      const token = jwt.sign({ cid: customer.id }, SECRET, { expiresIn: "7d" });
      const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=${destParam}`;

      // Construct HTML
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #000;">${template.heading}</h2>
          <p style="white-space: pre-wrap;">${template.body}</p>
          
          <div style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              ${template.button_text}
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
            Sent by ${tenant.business_name}
          </p>
        </div>
      `;

      try {
        // 5. Send via Google OAuth
        await sendGmail({
          tenantId: tenant.id,
          to: customer.email,
          subject: template.subject,
          html: htmlContent,
        });

        // 6. Update Database
        await Promise.all([
          // Mark customer as contacted
          supabase
            .from("customers")
            .update({
              status: "contacted",
              last_contacted_at: new Date().toISOString(),
            })
            .eq("id", customer.id),

          // Log the event
          supabase.from("email_logs").insert({
            customer_id: customer.id,
            email_type: emailType,
            status: "sent",
          }),
        ]);

        results.push({
          email: customer.email,
          status: "sent",
          type: emailType,
        });
      } catch (error: any) {
        console.error(`Failed to send to ${customer.email}:`, error.message);
        results.push({
          email: customer.email,
          status: "failed",
          reason: error.message,
        });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
