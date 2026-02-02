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
  if (!token) return new NextResponse("Missing Token", { status: 400 });

  let customerId: string;
  let customUrl: string | undefined;

  try {
    const decoded = jwt.verify(token, SECRET) as { cid: string; url?: string };
    customerId = decoded.cid;
    customUrl = decoded.url; // Get custom URL if present
  } catch (err) {
    return new NextResponse("Invalid Link", { status: 403 });
  }

  try {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select(
        "id, status, tenant_id, tenants(google_review_link, retention_link, business_name)",
      )
      .eq("id", customerId)
      .single();
    if (!customer) return new NextResponse("Not found", { status: 404 });

    await supabaseAdmin.from("email_logs").insert({
      customer_id: customerId,
      email_type: "click",
      status: "clicked",
    });
    if (customer.status !== "reviewed") {
      await supabaseAdmin
        .from("customers")
        .update({ status: "reviewed" })
        .eq("id", customerId);
    }

    const tenant = customer.tenants as any;
    let redirectUrl = "https://google.com";

    // 1. Priority: Custom URL from specific email step
    if (customUrl) {
      redirectUrl = customUrl;
    }
    // 2. Fallback: Google Review Link
    else if (tenant?.google_review_link) {
      redirectUrl = tenant.google_review_link;
    }
    // 3. Fallback: Search Query
    else if (tenant?.business_name) {
      redirectUrl = `https://www.google.com/search?q=${encodeURIComponent(tenant.business_name + " reviews")}`;
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return new NextResponse("Server Error", { status: 500 });
  }
}
