"use server";

import { createClient } from "@/lib/supabase/server";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import { sendGmail } from "@/lib/google"; // <--- NEW IMPORT
import { getTemplate, compileTemplate } from "@/lib/templates"; // <--- NEW IMPORT

const SECRET = process.env.TRACKING_JWT_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendReviewEmail(
  customerId: string,
  customerEmail: string,
) {
  const supabase = await createClient();

  // 1. Fetch Customer & Tenant ID
  const { data: customerData } = await supabase
    .from("customers")
    .select(`id, tenant_id, name, tenants(business_name)`)
    .eq("id", customerId)
    .single();

  if (!customerData) return { success: false, error: "Not found" };

  const tenantId = customerData.tenant_id;
  const tenantName = (customerData.tenants as any)?.business_name;
  const customerName = customerData.name || "there";

  // 2. FETCH TEMPLATE FROM DB
  const rawTemplate = await getTemplate(supabase, tenantId, "review");

  // 3. COMPILE VARIABLES
  const template = compileTemplate(rawTemplate, {
    name: customerName,
    business_name: tenantName,
  });

  // 4. Generate Link
  const token = jwt.sign({ cid: customerId }, SECRET, { expiresIn: "7d" });
  const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=google`;

  // 5. Construct Final HTML
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
        Sent by ${tenantName}
      </p>
    </div>
  `;

  // 6. Send
  try {
    await sendGmail({
      tenantId: tenantId,
      to: customerEmail,
      subject: template.subject,
      html: htmlContent,
    });

    // 7. Update DB
    await supabase
      .from("customers")
      .update({
        status: "contacted",
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", customerId);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Google Send Error:", error);
    return { success: false, error: "Failed to send: " + error.message };
  }
}
