"use server";

import { createClient } from "@/lib/supabase/server";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";
import { sendGmail } from "@/lib/google"; // <--- NEW IMPORT

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
    .select(`id, tenant_id, tenants(business_name)`)
    .eq("id", customerId)
    .single();

  if (!customerData) return { success: false, error: "Not found" };

  const tenantId = customerData.tenant_id;
  const tenantName = (customerData.tenants as any)?.business_name;

  // 2. Generate Links
  const token = jwt.sign({ cid: customerId }, SECRET, { expiresIn: "7d" });
  const magicLink = `${BASE_URL}/api/track/click?token=${token}&dest=google`;

  const htmlContent = `... (Your HTML here) ...`;

  try {
    // 3. Send via Google OAuth Helper
    await sendGmail({
      tenantId: tenantId,
      to: customerEmail,
      subject: `How was your visit to ${tenantName}?`,
      html: htmlContent,
    });

    // 4. Update DB
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
