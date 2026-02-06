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

  // 3. Generate a new API Key for this session
  // In production, consider hashing this key before storing,
  // but showing it once to the user in the config file.
  const apiKey = `sk_${Math.random().toString(36).substr(2)}${Date.now().toString(36)}`;

  // 4. Save Key to DB
  const { error: keyError } = await supabase.from("api_keys").insert({
    tenant_id: tenant.id,
    key_hash: apiKey, // Warning: Storing raw key for MVP. Hash in prod.
    label: "Desktop Connector",
  });

  if (keyError) {
    console.error("Key Gen Error:", keyError);
    return NextResponse.json(
      { error: "Failed to generate key" },
      { status: 500 },
    );
  }

  // 5. Read the Go Binary
  // Ensure you put the compiled 'GerpaTechConnector.exe' in your project's 'bin' folder
  // and rename it to 'connector.exe' for simplicity, or adjust the name below.
  const binaryPath = path.join(process.cwd(), "bin", "connector.exe");

  let binaryData;
  try {
    binaryData = fs.readFileSync(binaryPath);
  } catch (e) {
    console.error("Binary missing at:", binaryPath);
    return NextResponse.json(
      {
        error: "Server misconfiguration: Connector binary not found on server.",
      },
      { status: 500 },
    );
  }

  // 6. Create the Config JSON matching the Go App struct
  const configData = {
    file_path: "", // User must select this in UI
    api_key: apiKey,
    api_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/sync/excel`,
    sync_interval: 60,
    col_name: "A",
    col_email: "B",
    col_date: "C",
    sheet_name: "Sheet1",
  };

  // 7. Create Zip
  const zip = new JSZip();
  zip.file("GerpaTechConnector.exe", binaryData);
  zip.file("config.json", JSON.stringify(configData, null, 2));
  zip.file(
    "README.txt",
    `SETUP INSTRUCTIONS:
1. Extract all files to a folder.
2. Run GerpaTechConnector.exe.
3. The app will open. The API Key and URL are pre-filled from config.json.
4. Select your Excel file using the folder icon.
5. Adjust column letters (A, B, C) if needed.
6. Click "Save & Restart Sync".
    `,
  );

  const content = await zip.generateAsync({ type: "nodebuffer" });

  // 8. Return Download
  return new Response(content as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="GerpaTech-Connector.zip"',
    },
  });
}
