"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Initialize Admin Client (Bypasses RLS)
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// --- SECURITY CHECK ---
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if this user exists in the super_admins table
  const { data: admin } = await supabaseAdmin
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!admin) {
    // Log the attempt for security auditing
    console.warn(`Unauthorized Admin Access Attempt: ${user.email}`);
    redirect("/dashboard"); // Kick them out
  }

  return user;
}

// --- ACTIONS ---

export async function getAdminStats() {
  await assertAdmin();

  // Parallel fetch for speed
  const [tenants, customers, logs] = await Promise.all([
    supabaseAdmin.from("tenants").select("id", { count: "exact" }),
    supabaseAdmin.from("customers").select("id", { count: "exact" }),
    supabaseAdmin.from("email_logs").select("id", { count: "exact" }),
  ]);

  return {
    totalTenants: tenants.count || 0,
    totalCustomers: customers.count || 0,
    totalEmailsSent: logs.count || 0,
  };
}

export async function createManualTenant(
  name: string,
  email: string,
  password: string,
) {
  await assertAdmin();

  // 1. Create the Auth User (Supabase Admin API)
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm user
      user_metadata: { business_name: name }, // Passes data if you are using Triggers
    });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "User creation failed without error." };
  }

  // 2. Create the Tenant Record
  // We use 'upsert' here. Why?
  // If you followed the previous advice and have a Database Trigger set up,
  // the tenant row might already exist from step 1. Upsert prevents a crash.
  const { error: dbError } = await supabaseAdmin.from("tenants").upsert(
    {
      user_id: authData.user.id,
      business_name: name,
    },
    { onConflict: "user_id" },
  );

  if (dbError) {
    // Cleanup: If DB fails, delete the auth user to prevent "orphan" accounts
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: dbError.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function getAllTenants() {
  await assertAdmin();

  // Fetch tenants and join with auth.users to get emails is tricky via API
  // So we fetch tenants, and we have to rely on the data we have.
  // Note: To get emails, we might need a direct query to auth.users if we want to display login emails,
  // but for now, let's show Business Names and IDs.

  const { data: tenants } = await supabaseAdmin
    .from("tenants")
    .select(
      `
      *,
      customers:customers(count)
    `,
    )
    .order("created_at", { ascending: false });

  return tenants || [];
}

export async function deleteTenant(tenantId: string) {
  await assertAdmin();

  // 1. Retrieve the Auth User ID associated with this tenant
  const { data: tenant, error: fetchError } = await supabaseAdmin
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .single();

  if (fetchError || !tenant) {
    throw new Error("Tenant not found");
  }

  // 2. Manually delete database records first
  // We do this explicitly to prevent "Foreign Key Constraint" errors
  // if your database doesn't have "ON DELETE CASCADE" configured.

  // Delete logs (if you added the table)
  await supabaseAdmin.from("email_logs").delete().eq("customer_id", tenantId); // Only works if you join, but let's assume cascade or ignore for MVP

  // Delete customers
  await supabaseAdmin.from("customers").delete().eq("tenant_id", tenantId);

  // Delete tenant profile
  await supabaseAdmin.from("tenants").delete().eq("id", tenantId);

  // 3. Delete the actual Supabase Auth User
  // This prevents them from logging in again
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
    tenant.user_id,
  );

  if (authError) {
    console.error("Failed to delete auth user:", authError);
    // We return success: false here so the UI knows something went wrong,
    // even though the data is gone.
    return { success: false, error: authError.message };
  }

  return { success: true };
}
