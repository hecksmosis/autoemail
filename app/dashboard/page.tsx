"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

// Import Modular Tabs
import CustomersTab from "./customers-tab";
import TemplatesTab from "./templates-tab";
import SettingsTab from "./settings-tab";
import AnalyticsTab from "./analytics-tab";

type Customer = {
  id: string;
  name: string;
  email: string;
  last_visit_date: string;
  created_at: string;
  status: "pending" | "contacted" | "reviewed";
  last_contacted_at: string | null;
  service_tag?: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  // Global State
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "analytics" | "customers" | "templates" | "settings"
  >("analytics");

  // Fetch Data Logic
  const fetchCustomers = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomers(data);
  };

  useEffect(() => {
    const init = async () => {
      // 1. Check User
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || "");

      // 2. Check Tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, google_email_address") // Removed google_maps_link
        .eq("user_id", user.id)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        setGoogleEmail(tenant.google_email_address || null);

        // 3. Load Customers
        const { data: customerData } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });
        if (customerData) setCustomers(customerData);
      }

      setLoading(false);
    };

    init();
  }, [router, supabase]);

  // Wrapper to allow child components to refresh list
  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black relative font-sans">
      {/* NAVBAR */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-semibold tracking-tight text-lg">
              GerpaTech
            </span>
            <div className="hidden md:flex items-center gap-1">
              <NavButton
                label="Analytics"
                isActive={activeTab === "analytics"}
                onClick={() => setActiveTab("analytics")}
              />
              <NavButton
                label="Customers"
                isActive={activeTab === "customers"}
                onClick={() => setActiveTab("customers")}
              />
              <NavButton
                label="Programs"
                isActive={activeTab === "templates"}
                onClick={() => setActiveTab("templates")}
              />
              <NavButton
                label="Settings"
                isActive={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {activeTab === "analytics" && tenantId && (
          <AnalyticsTab tenantId={tenantId} />
        )}

        {activeTab === "customers" && tenantId && (
          <CustomersTab
            initialCustomers={customers}
            tenantId={tenantId}
            fetchCustomers={refreshCustomers}
          />
        )}

        {activeTab === "templates" && <TemplatesTab />}

        {activeTab === "settings" && tenantId && (
          <SettingsTab tenantId={tenantId} initialData={{ googleEmail }} />
        )}
      </main>
    </div>
  );
}

function NavButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
        isActive
          ? "bg-gray-800 text-white shadow-sm"
          : "text-gray-400 hover:text-white hover:bg-gray-900"
      }`}
    >
      {label}
    </button>
  );
}
