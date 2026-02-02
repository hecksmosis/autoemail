import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import jwt from "jsonwebtoken";
import { sendGmail } from "@/lib/google";
import { compileTemplate } from "@/lib/templates";

// ----------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------
const SECRET = process.env.TRACKING_JWT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to calculate days passed between two dates
const getDaysDifference = (from: string, to: Date = new Date()) => {
  const dateFrom = new Date(from);
  const diffTime = Math.abs(to.getTime() - dateFrom.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  console.log(`🤖 Cron Job Started: ${new Date().toISOString()}`);

  const results = {
    processed: 0,
    sent: 0,
    errors: 0,
    details: [] as any[],
  };

  try {
    // 2. Fetch Customers + Tenant Config + Programs
    // We fetch ALL active customers who are not 'reviewed'.
    // In a massive scale app, you'd batch this or filter by date logic in SQL.
    const { data: customers, error } = await supabase
      .from("customers")
      .select(
        `
        id, name, email, last_visit_date, status, service_tag,
        tenants (
          id, business_name, default_review_delay
        )
      `,
      )
      .neq("status", "reviewed");

    if (error) throw error;
    if (!customers || customers.length === 0) {
      return NextResponse.json({ message: "No active customers found." });
    }

    // 3. Loop through every customer to check if an email is due today
    for (const customer of customers) {
      const tenant = customer.tenants as any;
      if (!tenant) continue;

      results.processed++;
      const daysSinceVisit = getDaysDifference(customer.last_visit_date);

      let emailToSend = null;

      // -----------------------------------------------------------
      // LOGIC BRANCH A: Customer has a specific Service Tag (Advanced Program)
      // -----------------------------------------------------------
      if (customer.service_tag) {
        // Fetch the program and its steps for this service
        // OPTIMIZATION: In production, fetch all programs once at the start and map them.
        const { data: program } = await supabase
          .from("retention_programs")
          .select(
            `
            id, enabled,
            steps:program_steps (
              id, step_order, offset_days, enabled,
              template:email_templates ( * )
            )
          `,
          )
          .eq("tenant_id", tenant.id)
          .eq("service_tag", customer.service_tag)
          .eq("enabled", true)
          .single();

        if (program && program.steps) {
          // Find a step that matches TODAY's offset
          const dueStep = program.steps.find(
            (step: any) => step.enabled && step.offset_days === daysSinceVisit,
          );

          if (dueStep && dueStep.template) {
            emailToSend = {
              type: "retention",
              template: dueStep.template,
              programStepId: dueStep.id,
              destParam: "retention", // Link goes to booking
            };
          }
        }
      }

      // -----------------------------------------------------------
      // LOGIC BRANCH B: No Service Tag (Simple Review Flow)
      // -----------------------------------------------------------
      else {
        // Default to 1 day if not set
        const triggerDay = tenant.default_review_delay || 1;

        if (daysSinceVisit === triggerDay && customer.status === "pending") {
          // Fetch the 'review' template for this tenant
          const { data: reviewTemplate } = await supabase
            .from("email_templates")
            .select("*")
            .eq("tenant_id", tenant.id)
            .eq("type", "review")
            .single();

          if (reviewTemplate) {
            emailToSend = {
              type: "review",
              template: reviewTemplate,
              programStepId: null,
              destParam: "google", // Link goes to google
            };
          }
        }
      }

      // -----------------------------------------------------------
      // EXECUTION: Send Email if one was determined
      // -----------------------------------------------------------
      if (emailToSend) {
        const { template, type, destParam } = emailToSend;

        // Double check we haven't already sent an email TODAY to this person
        // (Prevents duplicate sends if cron runs twice)
        const { count } = await supabase
          .from("email_logs")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", customer.id)
          .gte("created_at", new Date().toISOString().split("T")[0]); // created today

        if (count && count > 0) {
          console.log(`Skipping ${customer.email}: Already sent email today.`);
          continue;
        }

        // Compile Content
        const compiled = compileTemplate(template, {
          name: customer.name || "there",
          business_name: tenant.business_name || "Us",
        });

        // Generate Token
        const token = jwt.sign({ cid: customer.id }, SECRET, {
          expiresIn: "30d",
        });
        const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=${destParam}`;

        // Construct HTML
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #000;">${compiled.heading}</h2>
            <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.5;">${compiled.body}</p>
            
            <div style="margin: 32px 0;">
              <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                ${compiled.button_text}
              </a>
            </div>

            <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
              Sent by ${tenant.business_name} • <a href="#" style="color: #888;">Unsubscribe</a>
            </p>
          </div>
        `;

        try {
          await sendGmail({
            tenantId: tenant.id,
            to: customer.email,
            subject: compiled.subject,
            html: htmlContent,
          });

          // Update Customer Status
          await supabase
            .from("customers")
            .update({
              status: "contacted",
              last_contacted_at: new Date().toISOString(),
            })
            .eq("id", customer.id);

          // Log It
          await supabase.from("email_logs").insert({
            customer_id: customer.id,
            email_type: type,
            status: "sent",
            metadata: {
              step_day: daysSinceVisit,
              service: customer.service_tag,
            },
          });

          results.sent++;
          results.details.push({
            email: customer.email,
            type,
            day: daysSinceVisit,
          });
        } catch (err: any) {
          console.error(`Failed to send to ${customer.email}:`, err);
          results.errors++;

          await supabase.from("email_logs").insert({
            customer_id: customer.id,
            email_type: type,
            status: "failed",
            error_message: err.message,
          });
        }
      }
    } // End Loop

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("Cron Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
