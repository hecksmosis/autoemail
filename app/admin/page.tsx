"use client";

import { useEffect, useState, FormEvent } from "react"; // Added FormEvent
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Trash2,
  Search,
  Building2,
  Users,
  Mail,
  Loader2,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import {
  getAdminStats,
  getAllTenants,
  deleteTenant,
  createManualTenant,
} from "./actions"; // Import new action

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalTenants: 0,
    totalCustomers: 0,
    totalEmailsSent: 0,
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // --- NEW STATE FOR CREATION ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loadData = async () => {
    try {
      const [statsData, tenantsData] = await Promise.all([
        getAdminStats(),
        getAllTenants(),
      ]);
      setStats(statsData);
      setTenants(tenantsData);
      setLoading(false);
    } catch (e) {
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleDelete = async (id: string, name: string) => {
    const confirmMessage = `⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to delete "${name}"?\nThis will delete all their customers and logs permanently.`;
    if (!confirm(confirmMessage)) return;

    setTenants((prev) => prev.filter((t) => t.id !== id)); // Optimistic

    try {
      await deleteTenant(id);
      await loadData(); // Refresh to ensure sync
    } catch (e) {
      alert("Failed to delete tenant");
      window.location.reload();
    }
  };

  // --- NEW HANDLER ---
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const result = await createManualTenant(
      newTenantData.name,
      newTenantData.email,
      newTenantData.password,
    );

    setIsCreating(false);

    if (result.success) {
      setIsCreateOpen(false);
      setNewTenantData({ name: "", email: "", password: "" });
      await loadData(); // Refresh list
      alert("Tenant created successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
          <p className="text-gray-500 font-mono text-sm">
            VERIFYING ADMIN CLEARANCE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-900 selection:text-white relative">
      {/* Admin Navbar */}
      <nav className="border-b border-red-900/30 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <ShieldAlert size={14} /> Super Admin
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Exit to App
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Building2 />}
            label="Total Tenants"
            value={stats.totalTenants}
          />
          <StatCard
            icon={<Users />}
            label="Total Customers"
            value={stats.totalCustomers}
          />
          <StatCard
            icon={<Mail />}
            label="Emails Sent"
            value={stats.totalEmailsSent}
          />
        </div>

        {/* Tenant Management Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Tenant Management</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search ID or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-md bg-[#111] border border-gray-800 text-sm focus:outline-none focus:border-red-900 transition-colors"
                />
              </div>

              {/* NEW BUTTON */}
              <button
                onClick={() => setIsCreateOpen(true)}
                className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                <span>New Tenant</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Business Name</th>
                  <th className="px-6 py-3">Tenant ID</th>
                  <th className="px-6 py-3">Customers</th>
                  <th className="px-6 py-3">Review Link?</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="group hover:bg-[#111] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {tenant.business_name || "Untitled"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {tenant.id}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {tenant.customers[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4">
                      {tenant.google_review_link ? (
                        <span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded">
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs bg-gray-800 px-2 py-1 rounded">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDelete(tenant.id, tenant.business_name)
                        }
                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Tenant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTenants.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No tenants found.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- CREATE TENANT MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Create New Tenant
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={newTenantData.name}
                  onChange={(e) =>
                    setNewTenantData({ ...newTenantData, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-900 transition-all"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={newTenantData.email}
                  onChange={(e) =>
                    setNewTenantData({
                      ...newTenantData,
                      email: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-900 transition-all"
                  placeholder="admin@acmecorp.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newTenantData.password}
                  onChange={(e) =>
                    setNewTenantData({
                      ...newTenantData,
                      password: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-900 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Provision Tenant"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A] flex items-center gap-4">
      <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div>
        <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">
          {label}
        </div>
        <div className="text-2xl font-bold text-white mt-1">
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
