import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client to bypass RLS (since we authenticate via API Key manually)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  // 1. Get the API Key from headers
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey)
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });

  // 2. Validate Key (In production, compare hashes. For MVP, we compare raw if you stored raw)
  // For this example, let's assume you stored the key directly in 'key_hash' for simplicity,
  // but IN PROD: bcrypt.compare(apiKey, storedHash)
  const { data: keyRecord } = await supabaseAdmin
    .from("api_keys")
    .select("tenant_id")
    .eq("key_hash", apiKey) // NOTE: Hash this in production!
    .single();

  if (!keyRecord)
    return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });

  try {
    const body = await request.json();
    const { rows } = body; // Expecting array of { name, email, date }

    if (!rows || !rows.length)
      return NextResponse.json({ success: true, count: 0 });

    // 3. Map Excel columns to DB columns
    const customers = rows.map((r: any) => ({
      tenant_id: keyRecord.tenant_id,
      name: r.Name,
      email: r.Email,
      last_visit_date: r.Date
        ? new Date(r.Date).toISOString()
        : new Date().toISOString(),
    }));

    // 4. Upsert (Insert or Update if email exists)
    // We assume Email is unique per tenant for this to work well
    const { error } = await supabaseAdmin
      .from("customers")
      .upsert(customers, { onConflict: "email, tenant_id" }); // Requires a unique index on DB

    if (error) throw error;

    return NextResponse.json({ success: true, count: customers.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
