import { google } from "googleapis";
import { decrypt, encrypt } from "./crypto";
import { createAdminClient } from "./supabase/admin"; // Your server client helper

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Helper to generate the Auth URL
export function getAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // CRITICAL: Gives us the Refresh Token
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: state, // We pass Tenant ID here to know who is connecting
    prompt: "consent", // Forces refresh token generation
  });
}

// Helper to construct a Raw Email (Base64URL encoded)
export function makeBody(
  to: string,
  from: string,
  subject: string,
  message: string,
) {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    message,
  ].join("\n");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// THE CORE SENDER FUNCTION
export async function sendGmail({ tenantId, to, subject, html }: any) {
  const supabase = createAdminClient();

  // 1. Get Tenant Tokens
  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "google_access_token, google_refresh_token, google_token_expiry, google_email_address",
    )
    .eq("id", tenantId)
    .single();

  if (!tenant || !tenant.google_refresh_token) {
    throw new Error("Tenant has not connected Google");
  }

  // 2. Setup Client
  oauth2Client.setCredentials({
    access_token: tenant.google_access_token
      ? decrypt(tenant.google_access_token)
      : undefined,
    refresh_token: decrypt(tenant.google_refresh_token),
    expiry_date: tenant.google_token_expiry,
  });

  // 3. Check / Refresh Token
  // The library handles this automatically if refresh_token is set,
  // but we need to save the new access token if it changes.
  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update DB with new tokens if they changed
  if (credentials.access_token && credentials.expiry_date) {
    await supabase
      .from("tenants")
      .update({
        google_access_token: encrypt(credentials.access_token),
        google_token_expiry: credentials.expiry_date,
      })
      .eq("id", tenantId);
  }

  // 4. Send Email
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const raw = makeBody(to, tenant.google_email_address, subject, html);

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { success: true };
}
