"use client";

import { useState, useRef } from "react";
import {
  Search,
  UploadCloud,
  Plus,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CSVUploadWithMapping } from "./csv-upload";
import { EnhancedCustomerRow } from "./customer-row";
import CustomerModal from "./customer-modal";

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

interface CustomersTabProps {
  initialCustomers: Customer[];
  tenantId: string;
  fetchCustomers: () => Promise<void>; // Parent refresh function
}

export default function CustomersTab({
  initialCustomers,
  tenantId,
  fetchCustomers,
}: CustomersTabProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local State
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const filteredCustomers = initialCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- HANDLERS ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]?.type === "text/csv") {
      fileInputRef.current!.files = e.dataTransfer.files;
      fileInputRef.current!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Customer",
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);
        if (error) {
          toast.error("Failed to delete");
        } else {
          toast.success("Customer deleted");
          fetchCustomers();
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-gray-400 mt-1">
            Manage your client list and assign email campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVUploadWithMapping onSuccess={fetchCustomers} />
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
        {/* Stats & Drop Zone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
            <div className="text-gray-500 text-sm font-medium uppercase">
              Total Customers
            </div>
            <div className="text-3xl font-bold mt-2 text-white">
              {initialCustomers.length}
            </div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
            <div className="text-gray-500 text-sm font-medium uppercase">
              Active Reviews
            </div>
            <div className="text-3xl font-bold mt-2 text-white">
              {initialCustomers.filter((c) => c.status === "reviewed").length}
            </div>
          </div>

          {/* Quick Import Drop Zone */}
          <div
            onClick={() => {
              // Trigger the hidden input in CSVUploadWithMapping component via DOM is tricky
              // simpler to just tell user to click the button above for now,
              // or clone the logic. For now, let's keep it visual.
              document
                .querySelector<HTMLButtonElement>(
                  "button[aria-label='Import CSV']",
                )
                ?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-xl border border-dashed bg-[#0A0A0A] transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
              isDragging
                ? "border-white bg-gray-900"
                : "border-gray-700 hover:bg-[#111] hover:border-gray-500"
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet
                size={20}
                className={isDragging ? "text-white" : "text-gray-400"}
              />
            </div>
            <p className="text-sm font-medium text-gray-300">Quick Import</p>
            <p className="text-xs text-gray-500">Drag & drop CSV anywhere</p>
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
                  <EnhancedCustomerRow
                    key={customer.id}
                    customer={customer}
                    onDelete={handleDeleteCustomer}
                    onUpdate={(id, updates) => {
                      // Optimistic updates are handled by parent fetch,
                      // but typically we'd update local state here.
                      // For simplicity, trigger refresh.
                      fetchCustomers();
                    }}
                    onEdit={() => openEditModal(customer)}
                  />
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <CustomerModal
          tenantId={tenantId}
          initialData={editingCustomer}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchCustomers();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
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
                onClick={() =>
                  setConfirmModal((p) => ({ ...p, isOpen: false }))
                }
                className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 h-10 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
