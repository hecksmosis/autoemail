import { createClient } from "@supabase/supabase-js";

// This is ONLY for server-side API routes (Cron jobs)
// It uses the SERVICE ROLE KEY to bypass RLS
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
