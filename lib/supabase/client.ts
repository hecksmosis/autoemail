"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // This creates a client instance scoped to the browser
  // It automatically handles cookies for Auth
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
