"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  ToggleLeft,
  ToggleRight,
  Tag,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRetentionPrograms,
  createRetentionProgram,
  updateRetentionProgram,
  deleteRetentionProgram,
  createProgramStep,
  updateProgramStep,
  deleteProgramStep,
  getServiceTagSuggestions,
  type RetentionProgram,
  type ProgramStep,
} from "./retention-actions";

type TemplateMode = "simple" | "programs";

export default function TemplatesTab() {
  const [mode, setMode] = useState<TemplateMode>("simple");
  const [programs, setPrograms] = useState<RetentionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTags, setServiceTags] = useState<string[]>([]);

  // Modals
  const [createProgramModal, setCreateProgramModal] = useState(false);
  const [createStepModal, setCreateStepModal] = useState<{
    open: boolean;
    programId: string | null;
  }>({ open: false, programId: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [programsData, tagsData] = await Promise.all([
        getRetentionPrograms(),
        getServiceTagSuggestions(),
      ]);
      setPrograms(programsData);
      setServiceTags(tagsData);
    } catch (error: any) {
      toast.error("Error loading programs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Retention Programs
          </h1>
          <p className="text-gray-400 mt-1">
            Create automated email sequences based on services/treatments
          </p>
        </div>
        <button
          onClick={() => setCreateProgramModal(true)}
          className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Program</span>
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("simple")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "simple"
              ? "bg-white text-black"
              : "bg-[#111] text-gray-400 hover:text-white"
          }`}
        >
          Simple Templates
        </button>
        <button
          onClick={() => setMode("programs")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "programs"
              ? "bg-white text-black"
              : "bg-[#111] text-gray-400 hover:text-white"
          }`}
        >
          Advanced Programs
        </button>
      </div>

      {/* Content based on mode */}
      {mode === "simple" ? (
        <SimpleTemplatesView />
      ) : (
        <ProgramsView
          programs={programs}
          onRefresh={loadData}
          onCreateStep={(programId) =>
            setCreateStepModal({ open: true, programId })
          }
        />
      )}

      {/* Create Program Modal */}
      {createProgramModal && (
        <CreateProgramModal
          serviceTags={serviceTags}
          onClose={() => setCreateProgramModal(false)}
          onSuccess={() => {
            setCreateProgramModal(false);
            loadData();
          }}
        />
      )}

      {/* Create Step Modal */}
      {createStepModal.open && createStepModal.programId && (
        <CreateStepModal
          programId={createStepModal.programId}
          existingSteps={
            programs.find((p) => p.id === createStepModal.programId)?.steps ||
            []
          }
          onClose={() => setCreateStepModal({ open: false, programId: null })}
          onSuccess={() => {
            setCreateStepModal({ open: false, programId: null });
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ========================================
// SIMPLE TEMPLATES VIEW (Original)
// ========================================
function SimpleTemplatesView() {
  return (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
      <div className="text-center py-12 text-gray-500">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Simple template editor coming soon...</p>
        <p className="text-sm mt-2">
          Switch to "Advanced Programs" for service-based sequences
        </p>
      </div>
    </div>
  );
}

// ========================================
// PROGRAMS VIEW (Main List)
// ========================================
function ProgramsView({
  programs,
  onRefresh,
  onCreateStep,
}: {
  programs: RetentionProgram[];
  onRefresh: () => void;
  onCreateStep: (programId: string) => void;
}) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  if (programs.length === 0) {
    return (
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-12 text-center">
        <Zap className="h-12 w-12 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Programs Created Yet
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Create your first retention program to automate follow-up emails based
          on services or treatments.
        </p>
        <div className="inline-flex items-start gap-4 text-left text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">✓</div>
            <div>
              <strong className="text-gray-300">Service-based</strong>
              <br />
              Different sequences per treatment
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5">✓</div>
            <div>
              <strong className="text-gray-300">Multi-step</strong>
              <br />
              Email at day 7, 30, 45, etc.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5">✓</div>
            <div>
              <strong className="text-gray-300">Auto-cancel</strong>
              <br />
              Stops when customer returns
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          isExpanded={expandedPrograms.has(program.id)}
          onToggleExpand={() => toggleExpand(program.id)}
          onRefresh={onRefresh}
          onCreateStep={() => onCreateStep(program.id)}
        />
      ))}
    </div>
  );
}

// ========================================
// PROGRAM CARD (Collapsible)
// ========================================
function ProgramCard({
  program,
  isExpanded,
  onToggleExpand,
  onRefresh,
  onCreateStep,
}: {
  program: RetentionProgram;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  onCreateStep: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(program.display_name);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateRetentionProgram(program.id, { display_name: displayName });
      toast.success("Program name updated");
      onRefresh();
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    setToggling(true);
    try {
      await updateRetentionProgram(program.id, { enabled: !program.enabled });
      toast.success(program.enabled ? "Program disabled" : "Program enabled");
      onRefresh();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete program "${program.display_name}"? This will remove all email steps.`,
      )
    )
      return;

    try {
      await deleteRetentionProgram(program.id);
      toast.success("Program deleted");
      onRefresh();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gray-900/30">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 h-8 px-3 rounded-md bg-[#111] border border-gray-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
          ) : (
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">
                {program.display_name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Tag size={12} />
                  {program.service_tag}
                </span>
                <span className="text-gray-700">•</span>
                <span className="text-xs text-gray-500">
                  {program.steps?.length || 0} email
                  {program.steps?.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="p-2 text-green-500 hover:bg-green-500/10 rounded transition-colors"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(program.display_name);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleEnabled}
                disabled={toggling}
                className={`p-2 rounded transition-colors ${
                  program.enabled
                    ? "text-green-500 hover:bg-green-500/10"
                    : "text-gray-600 hover:bg-gray-800"
                }`}
                title={program.enabled ? "Disable program" : "Enable program"}
              >
                {toggling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : program.enabled ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content: Steps */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {program.steps && program.steps.length > 0 ? (
            <>
              {program.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  programId={program.id}
                  onRefresh={onRefresh}
                />
              ))}
              <button
                onClick={onCreateStep}
                className="w-full h-10 border-2 border-dashed border-gray-700 rounded-md text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Another Email Step
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-10 w-10 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 text-sm mb-4">No email steps yet</p>
              <button
                onClick={onCreateStep}
                className="inline-flex h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
              >
                <Plus size={16} />
                Add First Email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// STEP CARD (Individual Email)
// ========================================
function StepCard({
  step,
  programId,
  onRefresh,
}: {
  step: ProgramStep;
  programId: string;
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [offsetDays, setOffsetDays] = useState(step.offset_days);
  const [subject, setSubject] = useState(step.template?.subject || "");
  const [heading, setHeading] = useState(step.template?.heading || "");
  const [body, setBody] = useState(step.template?.body || "");
  const [buttonText, setButtonText] = useState(
    step.template?.button_text || "",
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProgramStep(step.id, {
        offset_days: offsetDays,
        template: {
          subject,
          heading,
          body,
          button_text: buttonText,
        },
      });
      toast.success("Email step updated");
      onRefresh();
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this email step?")) return;
    try {
      await deleteProgramStep(step.id);
      toast.success("Email step deleted");
      onRefresh();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  if (isEditing) {
    return (
      <div className="border border-gray-700 rounded-lg p-4 bg-[#111] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">Edit Email Step</h4>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 uppercase font-medium">
              Send After (Days)
            </label>
            <input
              type="number"
              min="1"
              value={offsetDays}
              onChange={(e) => setOffsetDays(parseInt(e.target.value))}
              className="w-full h-9 px-3 mt-1 rounded-md bg-black border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-medium">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-9 px-3 mt-1 rounded-md bg-black border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-medium">
              Heading
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full h-9 px-3 mt-1 rounded-md bg-black border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
              placeholder="Hi {{name}}!"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-medium">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 mt-1 rounded-md bg-black border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-medium">
              Button Text
            </label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full h-9 px-3 mt-1 rounded-md bg-black border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 h-9 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-9 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
              <Clock size={12} />
              Day {step.offset_days}
            </span>
            {!step.enabled && (
              <span className="text-xs text-gray-600">(Disabled)</span>
            )}
          </div>
          <p className="text-sm text-white font-medium truncate">
            {step.template?.subject || "No subject"}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {step.template?.body || "No content"}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-600 hover:text-white hover:bg-gray-800 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// CREATE PROGRAM MODAL
// ========================================
function CreateProgramModal({
  serviceTags,
  onClose,
  onSuccess,
}: {
  serviceTags: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [serviceTag, setServiceTag] = useState("");
  const [useExisting, setUseExisting] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createRetentionProgram({
        display_name: displayName,
        service_tag: serviceTag,
        enabled: true,
      });
      toast.success("Program created!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Create Retention Program
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg text-sm text-blue-400">
            <strong>What is a Program?</strong>
            <p className="text-xs text-blue-400/70 mt-1">
              A program defines automated email sequences for a specific
              service/treatment (e.g., "Ácido hialurónico"). You can add
              multiple email steps at different days.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Program Name (Display)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
              placeholder="e.g., Ácido hialurónico"
            />
            <p className="text-xs text-gray-500">
              User-friendly name shown in dashboard
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase flex items-center justify-between">
              Service Tag (Internal)
              {serviceTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseExisting(!useExisting)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  {useExisting ? "Create new" : "Use existing"}
                </button>
              )}
            </label>

            {useExisting && serviceTags.length > 0 ? (
              <select
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
              >
                <option value="">Select existing tag...</option>
                {serviceTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                placeholder="e.g., hialuronico or acido_hialuronico"
              />
            )}
            <p className="text-xs text-gray-500">
              Must match the "service" column in your customer imports
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Create Program"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================================
// CREATE STEP MODAL
// ========================================
function CreateStepModal({
  programId,
  existingSteps,
  onClose,
  onSuccess,
}: {
  programId: string;
  existingSteps: ProgramStep[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [offsetDays, setOffsetDays] = useState(30);
  const [subject, setSubject] = useState("We miss you!");
  const [heading, setHeading] = useState("Hi {{name}},");
  const [body, setBody] = useState(
    "It's been a while since your last visit. We'd love to see you again!",
  );
  const [buttonText, setButtonText] = useState("Book Now");
  const [creating, setCreating] = useState(false);

  const nextStepOrder = existingSteps.length + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createProgramStep({
        program_id: programId,
        step_order: nextStepOrder,
        offset_days: offsetDays,
        cooldown_days: 0,
        template: {
          subject,
          heading,
          body,
          button_text: buttonText,
        },
      });
      toast.success("Email step added!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Add Email Step #{nextStepOrder}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {existingSteps.length > 0 && (
            <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <div className="text-xs text-amber-400">
                  <strong>Existing steps:</strong>{" "}
                  {existingSteps.map((s) => `Day ${s.offset_days}`).join(", ")}
                  <br />
                  Choose a different day to avoid conflicts.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Send After (Days)
            </label>
            <input
              type="number"
              min="1"
              required
              value={offsetDays}
              onChange={(e) => setOffsetDays(parseInt(e.target.value))}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
            />
            <p className="text-xs text-gray-500">
              Days after last visit to send this email
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Email Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Heading
            </label>
            <input
              type="text"
              required
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
              placeholder="Hi {{name}}!"
            />
            <p className="text-xs text-gray-500">
              Use {"{{name}}"} for personalization
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Body Content
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase">
              Button Text
            </label>
            <input
              type="text"
              required
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  Add Email Step
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
