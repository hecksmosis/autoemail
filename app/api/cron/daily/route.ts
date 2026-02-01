import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Use the Admin client helper
import jwt from "jsonwebtoken";
import { sendGmail } from "@/lib/google";

// Initialize Services
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
    `🤖 Cron Job Started. Checking for dates: ${yesterday} (Reviews) and ${thirtyDaysAgo} (Retention)`,
  );

  try {
    // 2. Fetch Candidates
    // We fetch customers AND their tenant details in one go
    const { data: candidates, error } = await supabase
      .from("customers")
      .select(
        `
        id, name, email, last_visit_date, status,
        tenants (
          id, business_name, email_reply_to, google_review_link
        )
      `,
      )
      .or(`last_visit_date.eq.${yesterday},last_visit_date.eq.${thirtyDaysAgo}`)
      .neq("status", "reviewed"); // Don't bug people who already reviewed

    if (error) throw error;

    const results = [];

    // 3. Loop and Process
    for (const customer of candidates || []) {
      const tenant = customer.tenants as any; // Type assertion helper

      // SKIP if no tenant info (orphan data)
      if (!tenant) continue;

      let emailType: "review" | "retention" = "review";
      let subject = "";
      let htmlContent = "";

      // Generate Secure Link
      const token = jwt.sign({ cid: customer.id }, SECRET, { expiresIn: "7d" });
      const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=google`;

      // --- LOGIC SPLIT: REVIEW VS RETENTION ---
      if (customer.last_visit_date === yesterday) {
        // CASE A: REVIEW (1 Day Later)
        // If they were already contacted or reviewed, skip (double check)
        if (customer.status !== "pending") continue;

        emailType = "review";
        subject = `Quick question from ${tenant.business_name}`;
        htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Hi ${customer.name || "there"},</h2>
            <p>Thanks for visiting <strong>${tenant.business_name}</strong> yesterday!</p>
            <p>We would love to get your feedback.</p>
            <div style="margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Write a Review
              </a>
            </div>
          </div>
        `;
      } else {
        // CASE B: RETENTION (30 Days Later)
        emailType = "retention";
        subject = `We miss you at ${tenant.business_name}!`;
        htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Hi ${customer.name || "there"},</h2>
            <p>It's been a while since we saw you at <strong>${tenant.business_name}</strong>.</p>
            <p>We'd love to see you again soon!</p>
            <div style="margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Book a Visit
              </a>
            </div>
          </div>
        `;
      }

      await sendGmail({
        tenantId: tenant.id, // This allows the helper to lookup tokens
        to: customer.email,
        subject: subject,
        html: htmlContent,
      });

      // 5. Update Database Logs & Status
      await Promise.all([
        supabase
          .from("customers")
          .update({
            status: "contacted",
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", customer.id),

        supabase.from("email_logs").insert({
          customer_id: customer.id,
          email_type: emailType,
          status: "sent",
        }),
      ]);

      results.push({ email: customer.email, status: "sent", type: emailType });
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
