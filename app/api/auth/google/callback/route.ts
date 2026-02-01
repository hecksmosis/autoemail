import { NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tenantId = searchParams.get("state"); // We passed this earlier

  if (!code || !tenantId)
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });

  const supabase = await createClient();

  try {
    // 1. Swap Code for Tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. Get User Email (to confirm who we are sending as)
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // 3. Save Encrypted Tokens to DB
    await supabase
      .from("tenants")
      .update({
        email_provider: "google",
        google_access_token: tokens.access_token
          ? encrypt(tokens.access_token)
          : null,
        google_refresh_token: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        google_token_expiry: tokens.expiry_date,
        google_email_address: userInfo.data.email,
      })
      .eq("id", tenantId);

    // 4. Redirect back to Dashboard Settings
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/dashboard?tab=settings&connected=true`,
    );
  } catch (error) {
    console.error("OAuth Error", error);
    return NextResponse.json(
      { error: "Authentication Failed" },
      { status: 500 },
    );
  }
}
