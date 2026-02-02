import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import jwt from "jsonwebtoken";
import { sendGmail } from "@/lib/google";
import { compileTemplate } from "@/lib/templates";

const SECRET = process.env.TRACKING_JWT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const getDaysDifference = (from: string, to: Date = new Date()) => {
  const dateFrom = new Date(from);
  const diffTime = Math.abs(to.getTime() - dateFrom.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { processed: 0, sent: 0, errors: 0 };

  try {
    const { data: customers, error } = await supabase
      .from("customers")
      .select(
        `
        id, name, email, last_visit_date, status, service_tag,
        tenants ( id, business_name, default_review_delay, enable_global_review_email )
      `,
      )
      .neq("status", "reviewed");

    if (error) throw error;

    for (const customer of customers || []) {
      const tenant = customer.tenants as any;
      if (!tenant) continue;

      results.processed++;
      const daysSinceVisit = getDaysDifference(customer.last_visit_date);
      let emailToSend = null;

      // 1. Check Service Programs
      if (customer.service_tag) {
        const { data: program } = await supabase
          .from("retention_programs")
          .select(
            `steps:program_steps(id, offset_days, enabled, template:email_templates(*))`,
          )
          .eq("tenant_id", tenant.id)
          .eq("service_tag", customer.service_tag)
          .eq("enabled", true)
          .single();

        if (program?.steps) {
          const step = program.steps.find(
            (s: any) => s.enabled && s.offset_days === daysSinceVisit,
          );
          if (step?.template) {
            emailToSend = {
              type: "retention",
              template: step.template,
              dest: "custom",
            };
          }
        }
      }
      // 2. Check Global Review (Only if enabled)
      else if (tenant.enable_global_review_email !== false) {
        if (
          daysSinceVisit === (tenant.default_review_delay || 1) &&
          customer.status === "pending"
        ) {
          const { data: tmpl } = await supabase
            .from("email_templates")
            .select("*")
            .eq("tenant_id", tenant.id)
            .eq("type", "review")
            .single();
          if (tmpl)
            emailToSend = { type: "review", template: tmpl, dest: "google" };
        }
      }

      if (emailToSend) {
        const { template, type, dest } = emailToSend;

        // Anti-spam check (one email per day)
        const { count } = await supabase
          .from("email_logs")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", customer.id)
          .gte("created_at", new Date().toISOString().split("T")[0]);
        if (count && count > 0) continue;

        const compiled = compileTemplate(template, {
          name: customer.name || "there",
          business_name: tenant.business_name || "Us",
        });

        // Generate Token (If template has custom URL, encode it)
        const payload: any = { cid: customer.id };
        if (template.button_url) payload.url = template.button_url; // Encode URL in token

        const token = jwt.sign(payload, SECRET, { expiresIn: "30d" });
        // If custom url exists, use 'custom' dest, otherwise fallback to default logic
        const finalDest = template.button_url ? "custom" : dest;
        const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=${finalDest}`;

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #000;">${compiled.heading}</h2>
            <p style="white-space: pre-wrap;">${compiled.body}</p>
            <div style="margin: 32px 0;"><a href="${magicLink}" style="background-color: #000; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${compiled.button_text}</a></div>
            <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">Sent by ${tenant.business_name}</p>
          </div>
        `;

        try {
          await sendGmail({
            tenantId: tenant.id,
            to: customer.email,
            subject: compiled.subject,
            html,
          });
          await supabase
            .from("customers")
            .update({
              status: "contacted",
              last_contacted_at: new Date().toISOString(),
            })
            .eq("id", customer.id);
          await supabase.from("email_logs").insert({
            customer_id: customer.id,
            email_type: type,
            status: "sent",
            metadata: { step_day: daysSinceVisit },
          });
          results.sent++;
        } catch (e) {
          results.errors++;
        }
      }
    }
    return NextResponse.json({ success: true, ...results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
