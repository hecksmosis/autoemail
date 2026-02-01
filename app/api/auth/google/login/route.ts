import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get Tenant ID to pass as "State"
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant)
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });

  // Redirect to Google
  const url = getAuthUrl(tenant.id);
  return NextResponse.redirect(url);
}
