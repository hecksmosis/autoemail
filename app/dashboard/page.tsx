"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { sendReviewEmail } from "@/app/actions";
import Papa from "papaparse";
import {
  LogOut,
  Plus,
  Search,
  UploadCloud,
  Users,
  MoreHorizontal,
  Loader2,
  FileSpreadsheet,
  X,
  Trash2,
  Mail,
  Pencil,
  Settings,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Unplug,
  Download,
  LayoutTemplate,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";

// --- TYPES ---
type Customer = {
  id: string;
  name: string;
  email: string;
  last_visit_date: string;
  created_at: string;
  status: "pending" | "contacted" | "reviewed";
  last_contacted_at: string | null;
};

type TemplateData = {
  subject: string;
  heading: string;
  body: string;
  button_text: string;
};

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    "customers" | "settings" | "templates"
  >("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  // Settings State
  const [reviewLink, setReviewLink] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [retentionLink, setRetentionLink] = useState("");
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    variant?: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => {},
    variant: "danger",
  });

  // Template states
  const [selectedTemplateType, setSelectedTemplateType] = useState<
    "review" | "retention"
  >("review");
  const [templateData, setTemplateData] = useState<TemplateData>({
    subject: "",
    heading: "",
    body: "",
    button_text: "",
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HELPER FUNCTIONS ---
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Confirm",
    variant: "danger" | "warning" = "danger",
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm,
      variant,
    });
  };

  const closeConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // --- DATA FETCHING ---
  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomers(data);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || "");

      const { data: tenant } = await supabase
        .from("tenants")
        .select(
          "id, google_review_link, email_reply_to, retention_link, google_email_address",
        )
        .eq("user_id", user.id)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        setReviewLink(tenant.google_review_link || "");
        setReplyToEmail(tenant.email_reply_to || "");
        setRetentionLink(tenant.retention_link || "");
        setGoogleEmail(tenant.google_email_address || null);
      }

      await fetchCustomers();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  useEffect(() => {
    if (activeTab === "templates" && tenantId) {
      loadTemplate(selectedTemplateType);
    }
  }, [activeTab, selectedTemplateType, tenantId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- FILTER ---
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- TEMPLATE ACTIONS ---
  const loadTemplate = async (type: "review" | "retention") => {
    // Try fetch from DB
    const { data } = await supabase
      .from("email_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("type", type)
      .single();

    if (data) {
      setTemplateData({
        subject: data.subject,
        heading: data.heading,
        body: data.body,
        button_text: data.button_text,
      });
    } else {
      // Load Defaults (Hardcoded for UI convenience)
      const defaults =
        type === "review"
          ? {
              subject: "How was your visit?",
              heading: "Hi {{name}}! 👋",
              body: "Thanks for visiting us recently. We'd love to know how we did.",
              button_text: "Leave a Review",
            }
          : {
              subject: "We miss you!",
              heading: "Hi {{name}},",
              body: "It's been a while since we saw you.",
              button_text: "Book a Visit",
            };
      setTemplateData(defaults);
    }
  };

  const handleSaveTemplate = async () => {
    if (!tenantId) return;
    setIsSavingTemplate(true);

    const payload = {
      tenant_id: tenantId,
      type: selectedTemplateType,
      ...templateData,
    };

    // Upsert (Insert or Update)
    const { error } = await supabase
      .from("email_templates")
      .upsert(payload, { onConflict: "tenant_id, type" });

    setIsSavingTemplate(false);
    if (error) {
      toast.error("Error saving template");
    } else {
      toast.success("Template saved!");
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSavingSettings(true);

    const { error } = await supabase
      .from("tenants")
      .update({
        google_review_link: reviewLink,
        email_reply_to: replyToEmail,
        retention_link: retentionLink,
      })
      .eq("id", tenantId);

    setSavingSettings(false);
    if (error) {
      toast.error("Error saving settings");
    } else {
      toast.success("Settings saved successfully");
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!tenantId) return;

    showConfirm(
      "Disconnect Google Account",
      "Are you sure you want to disconnect? We won't be able to send emails on your behalf until you reconnect.",
      async () => {
        setDisconnecting(true);

        const { error } = await supabase
          .from("tenants")
          .update({
            email_provider: "resend",
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_email_address: null,
          })
          .eq("id", tenantId);

        setDisconnecting(false);
        if (error) {
          toast.error("Failed to disconnect: " + error.message);
        } else {
          setGoogleEmail(null);
          toast.success("Google account disconnected");
        }
        closeConfirm();
      },
      "Disconnect",
      "warning",
    );
  };

  // --- CUSTOMER ACTIONS ---
  const handleDeleteCustomer = async (id: string, name: string) => {
    showConfirm(
      "Delete Customer",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        // Optimistic update
        setCustomers((prev) => prev.filter((c) => c.id !== id));

        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);

        if (error) {
          toast.error("Failed to delete customer");
          fetchCustomers(); // Revert on error
        } else {
          toast.success("Customer deleted");
        }
        closeConfirm();
      },
      "Delete",
      "danger",
    );
  };

  const handleUpdateLocal = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      date: customer.last_visit_date,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setIsSubmitting(true);

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: formData.name,
            email: formData.email,
            last_visit_date: formData.date,
          })
          .eq("id", editingCustomer.id);
        if (error) throw error;
        handleUpdateLocal(editingCustomer.id, {
          name: formData.name,
          email: formData.email,
          last_visit_date: formData.date,
        });
        toast.success("Customer updated successfully");
      } else {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            tenant_id: tenantId,
            name: formData.name,
            email: formData.email,
            last_visit_date: formData.date,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setCustomers((prev) => [data, ...prev]);
        toast.success("Customer added successfully");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CSV ACTIONS ---
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch("/api/customers/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          });

          if (response.ok) {
            await fetchCustomers();
            toast.success(
              `Successfully uploaded ${results.data.length} customers`,
            );
          } else {
            toast.error("Failed to upload CSV");
          }
        } catch (error) {
          toast.error("Error uploading file");
        } finally {
          setUploading(false);
          setIsDragging(false);
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file");
        setUploading(false);
        setIsDragging(false);
      },
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]?.type === "text/csv")
      handleFileUpload(e.dataTransfer.files[0]);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black relative">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />

      {/* NAVBAR */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-semibold tracking-tight text-lg">
              SaaS_App
            </span>
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab("customers")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "customers" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-900"}`}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "templates" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-900"}`}
              >
                Templates
              </button>{" "}
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "settings" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-900"}`}
              >
                Settings
              </button>
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* --- CUSTOMERS VIEW --- */}
        {activeTab === "customers" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                <p className="text-gray-400 mt-1">
                  Manage your client list and track retention.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-9 px-4 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={openAddModal}
                  className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Stats & CSV Drop Zone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
                  <div className="text-gray-500 text-sm font-medium uppercase">
                    Total Customers
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {customers.length}
                  </div>
                </div>
                <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
                  <div className="text-gray-500 text-sm font-medium uppercase">
                    Active Reviews
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {customers.filter((c) => c.status === "reviewed").length}
                  </div>
                </div>

                {/* THE CSV DROP ZONE */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`p-6 rounded-xl border border-dashed bg-[#0A0A0A] transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${isDragging ? "border-white bg-gray-900" : "border-gray-700 hover:bg-[#111] hover:border-gray-500"} ${uploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  {uploading ? (
                    <Loader2 className="h-10 w-10 text-gray-500 animate-spin mb-3" />
                  ) : (
                    <div
                      className={`h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${isDragging ? "bg-white" : ""}`}
                    >
                      <FileSpreadsheet
                        size={20}
                        className={isDragging ? "text-black" : "text-gray-400"}
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-300">
                    {uploading ? "Importing..." : "Quick Import"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {uploading ? "Processing CSV..." : "Drag & drop CSV here"}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-800 rounded-xl overflow-visible bg-[#0A0A0A] min-h-[400px]">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-md bg-black border border-gray-800 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-visible">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50 text-gray-400 font-medium">
                      <tr>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Last Visit</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredCustomers.map((customer) => (
                        <CustomerRow
                          key={customer.id}
                          customer={customer}
                          onDelete={handleDeleteCustomer}
                          onUpdate={handleUpdateLocal}
                          onEdit={() => openEditModal(customer)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-center text-xs text-gray-600 mt-4">
                Showing {filteredCustomers.length} results
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: TEMPLATES --- */}
        {activeTab === "templates" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Email Templates
                </h1>
                <p className="text-gray-400 mt-1">
                  Design the emails your customers will receive.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTemplateType("review")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTemplateType === "review" ? "bg-white text-black" : "bg-[#111] text-gray-400 hover:text-white"}`}
                >
                  Review Email
                </button>
                <button
                  onClick={() => setSelectedTemplateType("retention")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedTemplateType === "retention" ? "bg-white text-black" : "bg-[#111] text-gray-400 hover:text-white"}`}
                >
                  Retention Email
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 h-[600px]">
              {/* EDITOR COLUMN */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 flex-1 flex flex-col gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-gray-500">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={templateData.subject}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          subject: e.target.value,
                        })
                      }
                      className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-gray-500">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={templateData.heading}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          heading: e.target.value,
                        })
                      }
                      className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                    />
                    <p className="text-[10px] text-gray-500">
                      Tip: Use {"{{name}}"} to insert customer name.
                    </p>
                  </div>

                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs uppercase font-bold text-gray-500">
                      Body Content
                    </label>
                    <textarea
                      value={templateData.body}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          body: e.target.value,
                        })
                      }
                      className="w-full flex-1 bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-gray-500">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={templateData.button_text}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          button_text: e.target.value,
                        })
                      }
                      className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={isSavingTemplate}
                      className="w-full py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      {isSavingTemplate ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      Save Template
                    </button>
                  </div>
                </div>
              </div>

              {/* PREVIEW COLUMN */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-4 right-4 text-xs text-gray-500 font-mono flex items-center gap-2">
                  <Eye size={12} /> LIVE PREVIEW
                </div>

                {/* Email Canvas */}
                <div className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl overflow-hidden">
                  {/* Fake Email Header */}
                  <div className="bg-gray-100 p-4 border-b border-gray-200 text-xs text-gray-500">
                    <div className="flex justify-between mb-1">
                      <span>From:</span>{" "}
                      <span className="text-gray-900 font-medium">
                        Your Business
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subject:</span>{" "}
                      <span className="text-gray-900 font-medium">
                        {templateData.subject.replace("{{name}}", "John")}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-8 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {templateData.heading.replace("{{name}}", "John")}
                    </h2>

                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {templateData.body.replace("{{name}}", "John")}
                    </p>

                    <div>
                      <button className="bg-black text-white font-bold py-3 px-6 rounded-md shadow-lg transform active:scale-95 transition-transform">
                        {templateData.button_text}
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-8 pt-8 border-t border-gray-100">
                      If you have issues, reply to this email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* --- SETTINGS VIEW --- */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-400 mt-1">
                  Configure your integration and notification preferences.
                </p>
              </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
              {/* OAUTH CARD */}
              <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-gray-400" />
                    Email Provider
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect the account you want to send emails from.
                  </p>
                </div>
                <div className="p-6">
                  {googleEmail ? (
                    <div className="flex items-center justify-between p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            Connected to Google
                          </p>
                          <p className="text-xs text-green-500/70 mt-0.5">
                            Sending as: {googleEmail}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDisconnectGoogle}
                        disabled={disconnecting}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Disconnect"
                      >
                        {disconnecting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Unplug size={18} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-amber-900/10 border border-amber-900/30 p-4 rounded-lg">
                        <AlertCircle className="text-amber-500" size={20} />
                        <p className="text-sm text-amber-500">
                          No email provider connected. Emails will fail to send.
                        </p>
                      </div>
                      <a
                        href="/api/auth/google/login"
                        className="inline-flex h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Connect Google Account
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* CONFIG CARD */}
              <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <Settings size={20} className="text-gray-400" />
                    Links & Configuration
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage where your customers are redirected.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                  {/* Reply To */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Mail size={16} /> Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={replyToEmail}
                      onChange={(e) => setReplyToEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                      placeholder="manager@business.com"
                    />
                    <p className="text-xs text-gray-500">
                      Replies from customers will be sent here.
                    </p>
                  </div>

                  {/* Google Review Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <LinkIcon size={16} /> Google Reviews Link
                    </label>
                    <input
                      type="url"
                      value={reviewLink}
                      onChange={(e) => setReviewLink(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                      placeholder="https://g.page/r/..."
                    />
                    <p className="text-xs text-gray-500">
                      Destination for the "Leave a Review" button.
                    </p>
                  </div>

                  {/* Retention Link */}
                  <div className="space-y-2 pt-4 border-t border-gray-800">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Calendar size={16} /> Booking / Retention Link
                    </label>
                    <input
                      type="url"
                      value={retentionLink}
                      onChange={(e) => setRetentionLink(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
                      placeholder="https://mybusiness.com/book"
                    />
                    <p className="text-xs text-gray-500">
                      Destination for the "Come Back" button.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingSettings ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* EXCEL SYNC CARD */}
              <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-gray-400" />
                    Desktop Sync (Excel)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically sync customer data from your computer.
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg">
                    <p className="text-sm text-blue-400">
                      <strong>How it works:</strong> Download the connector, set
                      your Excel file path, and let it run. It syncs new
                      customers hourly.
                    </p>
                  </div>
                  <a
                    href="/api/download-connector"
                    target="_blank"
                    className="inline-flex h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
                  >
                    <Download size={16} /> Download Pre-configured Connector
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL (ADD/EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Last Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all [color-scheme:dark]"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingCustomer ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                    confirmModal.variant === "danger"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">
                    {confirmModal.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeConfirm}
                  className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className={`flex-1 h-10 rounded-md text-sm font-medium transition-colors ${
                    confirmModal.variant === "danger"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function CustomerRow({
  customer,
  onDelete,
  onUpdate,
  onEdit,
}: {
  customer: Customer;
  onDelete: (id: string, name: string) => void;
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
    // Call Server Action
    const result = await sendReviewEmail(customer.id, customer.email);
    setSending(false);
    setIsOpen(false);

    if (result.success) {
      const now = new Date().toISOString();
      onUpdate(customer.id, { status: "contacted", last_contacted_at: now });
      toast.success("Email sent successfully!");
    } else {
      toast.error("Failed to send email: " + result.error);
    }
  };

  return (
    <tr className="group hover:bg-[#111] transition-colors relative">
      <td className="px-6 py-4">
        <div className="font-medium text-white">{customer.name}</div>
        <div className="text-gray-500 text-xs">{customer.email}</div>
      </td>
      <td className="px-6 py-4 text-gray-400">
        {new Date(customer.last_visit_date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">{getStatusBadge(customer)}</td>
      <td className="px-6 py-4 text-right relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 rounded-md transition-colors ${isOpen ? "text-white bg-gray-800" : "text-gray-500 hover:text-white hover:bg-gray-900"}`}
        >
          <MoreHorizontal size={16} />
        </button>
        {isOpen && (
          <div
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
        )}
        {isOpen && (
          <div className="absolute right-8 top-8 z-20 w-48 rounded-lg border border-gray-800 bg-[#0A0A0A] shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            <div className="p-1 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onEdit();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1A1A1A] rounded-md transition-colors text-left"
              >
                <Pencil size={14} /> <span>Edit Details</span>
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1A1A1A] rounded-md transition-colors text-left"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}{" "}
                <span>Send Review Email</span>
              </button>
              <div className="h-px bg-gray-800 my-1 mx-1" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDelete(customer.id, customer.name);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left"
              >
                <Trash2 size={14} /> <span>Delete Customer</span>
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function getStatusBadge(customer: Customer) {
  if (customer.status === "reviewed")
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900">
        Review Done
      </span>
    );
  if (customer.status === "contacted")
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-900">
        Email Sent
      </span>
    );
  const diffDays = Math.ceil(
    Math.abs(
      new Date().getTime() - new Date(customer.last_visit_date).getTime(),
    ) /
      (1000 * 60 * 60 * 24),
  );
  if (diffDays > 30)
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-500 border border-amber-900">
        At Risk
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
      Pending
    </span>
  );
}
