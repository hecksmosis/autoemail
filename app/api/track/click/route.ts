import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SECRET = process.env.TRACKING_JWT_SECRET!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing Token", { status: 400 });
  }

  let customerId: string;

  // 1. Verify and Decode JWT
  try {
    const decoded = jwt.verify(token, SECRET) as { cid: string };
    customerId = decoded.cid;
  } catch (err) {
    return new NextResponse("Invalid or Expired Link", { status: 403 });
  }

  try {
    // 2. Fetch Tenant Info
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select(
        `
        id, status, tenant_id,
        tenants ( google_review_link, business_name )
      `,
      )
      .eq("id", customerId)
      .single();

    if (fetchError || !customer) {
      return new NextResponse("Customer not found", { status: 404 });
    }

    // 3. Log Interaction
    await supabaseAdmin.from("email_logs").insert({
      customer_id: customerId,
      email_type: "review",
      status: "clicked",
    });

    // 4. Update Status
    if (customer.status !== "reviewed") {
      await supabaseAdmin
        .from("customers")
        .update({ status: "reviewed" })
        .eq("id", customerId);
    }

    // 5. Determine Redirect
    const tenant = customer.tenants as any;
    let redirectUrl = tenant?.google_review_link;

    if (!redirectUrl && tenant?.business_name) {
      redirectUrl = `https://www.google.com/search?q=${encodeURIComponent(tenant.business_name + " reviews")}`;
    }

    return NextResponse.redirect(redirectUrl || "https://google.com");
  } catch (error) {
    console.error("Tracking Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
