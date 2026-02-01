import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get the Tenant ID for this user
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { rows } = body; // Expecting { rows: [{ name, email, date }] }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // 3. Format Data for DB
    // We map CSV columns to DB columns.
    // Assumes CSV headers are somewhat normalized or we handle it here.
    const customersToInsert = rows.map((row: any) => ({
      tenant_id: tenant.id,
      name: row.Name || row.name,
      email: row.Email || row.email,
      // Default to today if date missing, or parse it
      last_visit_date: row.Date || row.date || new Date().toISOString(),
    }));

    // 4. Batch Insert
    const { error: insertError } = await supabase
      .from("customers")
      .insert(customersToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      count: customersToInsert.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
