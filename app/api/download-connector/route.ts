import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 1. Authenticate User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Get Tenant ID
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant)
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // 3. Generate a new Long-Lived API Key
  // In a real app, you might want to reuse an existing key or allow key rotation.
  // Here we generate a simple random key for the connector.
  const apiKey = `sk_${Math.random().toString(36).substr(2)}${Date.now().toString(36)}`;

  // 4. Save Key to DB
  // We use the Service Role (Admin) client implicitly via database policies or
  // you might need `supabaseAdmin` if your RLS is strict on api_keys table.
  // Assuming 'api_keys' table allows insert by authenticated users for their tenant:
  const { error: keyError } = await supabase.from("api_keys").insert({
    tenant_id: tenant.id,
    key_hash: apiKey, // In prod, hash this!
    label: "One-Click Connector",
  });

  if (keyError) {
    console.error("Key Gen Error:", keyError);
    return NextResponse.json(
      { error: "Failed to generate key" },
      { status: 500 },
    );
  }

  // 5. Read the Generic Binary
  // Vercel/Next.js specific path resolution
  const binaryPath = path.join(process.cwd(), "bin", "connector.exe");

  let binaryData;
  try {
    binaryData = fs.readFileSync(binaryPath);
  } catch (e) {
    return NextResponse.json(
      { error: "Server misconfiguration: Binary not found" },
      { status: 500 },
    );
  }

  // 6. Create the Config JSON
  const configData = {
    file_path: "C:\\Users\\User\\Desktop\\customers.xlsx", // Default placeholder
    api_key: apiKey,
    api_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/sync/excel`,
    sync_every_minutes: 60,
  };

  // 7. Create Zip
  const zip = new JSZip();
  zip.file("connector.exe", binaryData);
  zip.file("config.json", JSON.stringify(configData, null, 2));
  zip.file(
    "README.txt",
    "1. Place your Excel file path in config.json\n2. Run connector.exe",
  );

  const content = await zip.generateAsync({ type: "nodebuffer" });

  // 8. Return Download
  return new Response(content as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="saas-connector.zip"',
    },
  });
}
