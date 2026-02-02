import { useState } from "react";
import {
  MoreHorizontal,
  Loader2,
  Trash2,
  Mail,
  Pencil,
  Calendar,
  Tag,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { sendReviewEmail } from "@/app/actions";
import { getCustomerProgramStatus } from "./retention-actions";

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

type ProgramStatus = {
  hasProgram: boolean;
  programName: string | null;
  nextEmailDays: number | null;
  daysSinceVisit: number | null;
  totalSteps?: number;
};

export function EnhancedCustomerRow({
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
  const [programStatus, setProgramStatus] = useState<ProgramStatus | null>(
    null,
  );
  const [loadingStatus, setLoadingStatus] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
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

  const loadProgramStatus = async () => {
    if (programStatus) return; // Already loaded
    setLoadingStatus(true);
    try {
      const status = await getCustomerProgramStatus(customer.id);
      setProgramStatus(status);
    } catch (error) {
      console.error("Error loading program status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRowClick = () => {
    if (!programStatus && customer.service_tag) {
      loadProgramStatus();
    }
  };

  return (
    <tr
      className="group hover:bg-[#111] transition-colors relative cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4">
        <div className="font-medium text-white">{customer.name}</div>
        <div className="text-gray-500 text-xs">{customer.email}</div>

        {/* Service Tag Display */}
        {customer.service_tag && (
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs">
              <Tag size={10} />
              {customer.service_tag}
            </span>
          </div>
        )}

        {/* Program Status (appears after click/load) */}
        {loadingStatus && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={12} className="animate-spin" />
            Loading program...
          </div>
        )}

        {programStatus && programStatus.hasProgram && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Zap size={12} className="text-blue-400" />
              <span className="text-blue-400 font-medium">
                {programStatus.programName}
              </span>
              <span className="text-gray-600">
                ({programStatus.totalSteps} email
                {programStatus.totalSteps !== 1 ? "s" : ""})
              </span>
            </div>

            {programStatus.nextEmailDays !== null ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                Next email in {programStatus.nextEmailDays} days
              </div>
            ) : (
              <div className="text-xs text-gray-600">All emails sent</div>
            )}

            {programStatus.daysSinceVisit !== null && (
              <div className="text-xs text-gray-600">
                {programStatus.daysSinceVisit} days since last visit
              </div>
            )}
          </div>
        )}

        {programStatus && !programStatus.hasProgram && customer.service_tag && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
            <Calendar size={12} />
            No program for this service
          </div>
        )}
      </td>

      <td className="px-6 py-4 text-gray-400">
        {new Date(customer.last_visit_date).toLocaleDateString()}
      </td>

      <td className="px-6 py-4">{getStatusBadge(customer)}</td>

      <td className="px-6 py-4 text-right relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-1 rounded-md transition-colors ${
            isOpen
              ? "text-white bg-gray-800"
              : "text-gray-500 hover:text-white hover:bg-gray-900"
          }`}
        >
          <MoreHorizontal size={16} />
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-10 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
        )}

        {isOpen && (
          <div className="absolute right-8 top-8 z-20 w-48 rounded-lg border border-gray-800 bg-[#0A0A0A] shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            <div className="p-1 flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onEdit();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1A1A1A] rounded-md transition-colors text-left"
              >
                <Pencil size={14} /> <span>Edit Details</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendEmail();
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
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
