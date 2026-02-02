"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getRetentionPrograms, RetentionProgram } from "./retention-actions";

type Customer = {
  id: string;
  name: string;
  email: string;
  last_visit_date: string;
  service_tag?: string | null;
};

interface CustomerModalProps {
  tenantId: string;
  initialData: Customer | null; // null = add mode
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export default function CustomerModal({
  tenantId,
  initialData,
  onClose,
  onSuccess,
}: CustomerModalProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    date:
      initialData?.last_visit_date || new Date().toISOString().split("T")[0],
    service: initialData?.service_tag || "",
  });

  const [programs, setPrograms] = useState<RetentionProgram[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Fetch available programs to populate the dropdown
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await getRetentionPrograms();
        // Filter only enabled programs for new assignments
        setPrograms(data.filter((p) => p.enabled));
      } catch (e) {
        console.error("Failed to load programs", e);
      } finally {
        setLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        last_visit_date: formData.date,
        service_tag: formData.service || null,
      };

      let result;

      if (initialData) {
        // Update
        const { data, error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", initialData.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast.success("Customer updated");
      } else {
        // Create
        const { data, error } = await supabase
          .from("customers")
          .insert({
            tenant_id: tenantId,
            ...payload,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast.success("Customer added");
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Edit Customer" : "Add Customer"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
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
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
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
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white [color-scheme:dark]"
            />
          </div>

          {/* CAMPAIGN SELECTION */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
              Assigned Campaign (Program)
              {loadingPrograms && (
                <Loader2 size={12} className="animate-spin" />
              )}
            </label>
            <div className="relative">
              <Zap
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                value={formData.service}
                onChange={(e) =>
                  setFormData({ ...formData, service: e.target.value })
                }
                className="w-full h-10 pl-10 pr-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white appearance-none"
              >
                <option value="">(No Campaign)</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.service_tag}>
                    {program.display_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {formData.service && (
              <p className="text-xs text-blue-400 mt-1">
                Matches program:{" "}
                {
                  programs.find((p) => p.service_tag === formData.service)
                    ?.display_name
                }
              </p>
            )}
            <p className="text-[10px] text-gray-600 mt-1">
              Selecting a campaign sets the hidden "Service Tag" to match the
              program.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
              ) : initialData ? (
                "Update"
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
