"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Tag,
  Clock,
  Zap,
  Eye,
  Link as LinkIcon,
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
import SimpleTemplatesView from "./simple-templates-view";
import { createClient } from "@/lib/supabase/client";

type TemplateMode = "simple" | "programs";

let programCache: RetentionProgram[] | null = null;
let tagsCache: string[] | null = null;

export default function TemplatesTab() {
  const [mode, setMode] = useState<TemplateMode>("simple");
  const [programs, setPrograms] = useState<RetentionProgram[]>(
    programCache || [],
  );
  const [loading, setLoading] = useState(!programCache);
  const [serviceTags, setServiceTags] = useState<string[]>(tagsCache || []);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const supabase = createClient();

  const [selectedPreviewStep, setSelectedPreviewStep] =
    useState<ProgramStep | null>(null);
  const [createProgramModal, setCreateProgramModal] = useState(false);
  const [createStepModal, setCreateStepModal] = useState<{
    open: boolean;
    programId: string | null;
  }>({ open: false, programId: null });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("tenants")
          .select("id")
          .eq("user_id", data.user.id)
          .single()
          .then(({ data: t }) => {
            if (t) setTenantId(t.id);
          });
      }
    });
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
      programCache = programsData;
      tagsCache = tagsData;
    } catch (error: any) {
      toast.error("Error loading programs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Retention Programs
          </h1>
          <p className="text-gray-400 mt-1">
            Create automated email sequences based on services.
          </p>
        </div>
        <button
          onClick={() => setCreateProgramModal(true)}
          className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> <span>New Program</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("simple")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "simple" ? "bg-white text-black" : "bg-[#111] text-gray-400 hover:text-white"}`}
        >
          Simple Templates
        </button>
        <button
          onClick={() => setMode("programs")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "programs" ? "bg-white text-black" : "bg-[#111] text-gray-400 hover:text-white"}`}
        >
          Advanced Programs
        </button>
      </div>

      {mode === "simple" && tenantId ? (
        <SimpleTemplatesView tenantId={tenantId} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <ProgramsView
              programs={programs}
              onRefresh={loadData}
              onCreateStep={(programId: any) =>
                setCreateStepModal({ open: true, programId })
              }
              onPreviewStep={(step: any) => setSelectedPreviewStep(step)}
            />
          </div>
          <div className="lg:col-span-1 sticky top-6">
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden min-h-[400px] flex flex-col">
              <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Email Preview
                </span>
                {selectedPreviewStep && (
                  <button
                    onClick={() => setSelectedPreviewStep(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {selectedPreviewStep ? (
                <div className="p-6 flex-1 bg-gray-900 flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg shadow-xl overflow-hidden text-black animate-in zoom-in-95 duration-200">
                    <div className="bg-gray-100 p-3 border-b border-gray-200 text-[10px] text-gray-500">
                      <div className="flex justify-between mb-1">
                        <span>Subject:</span>{" "}
                        <span className="text-gray-900 font-medium truncate ml-2">
                          {selectedPreviewStep.template?.subject}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 text-center space-y-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedPreviewStep.template?.heading.replace(
                          "{{name}}",
                          "John",
                        )}
                      </h2>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedPreviewStep.template?.body}
                      </p>
                      <button className="bg-black text-white font-bold py-2 px-4 rounded text-sm mt-2">
                        {selectedPreviewStep.template?.button_text}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-4">
                    Scheduled for Day {selectedPreviewStep.offset_days}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                  <Eye className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">
                    Click the eye icon on any email step to preview it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

function ProgramsView({
  programs,
  onRefresh,
  onCreateStep,
  onPreviewStep,
}: any) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(
    new Set(),
  );
  const toggleExpand = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) newExpanded.delete(programId);
    else newExpanded.add(programId);
    setExpandedPrograms(newExpanded);
  };
  const handleQuickAdd = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    newExpanded.add(programId);
    setExpandedPrograms(newExpanded);
    onCreateStep(programId);
  };

  if (programs.length === 0)
    return (
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-12 text-center">
        <Zap className="h-12 w-12 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Programs Created Yet
        </h3>
      </div>
    );

  return (
    <div className="space-y-4">
      {programs.map((program: RetentionProgram) => (
        <ProgramCard
          key={program.id}
          program={program}
          isExpanded={expandedPrograms.has(program.id)}
          onToggleExpand={() => toggleExpand(program.id)}
          onRefresh={onRefresh}
          onCreateStep={() => onCreateStep(program.id)}
          onQuickAdd={() => handleQuickAdd(program.id)}
          onPreviewStep={onPreviewStep}
        />
      ))}
    </div>
  );
}

function ProgramCard({
  program,
  isExpanded,
  onToggleExpand,
  onRefresh,
  onCreateStep,
  onQuickAdd,
  onPreviewStep,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(program.display_name);
  const sortedSteps = program.steps?.sort(
    (a: any, b: any) => a.offset_days - b.offset_days,
  );

  const handleSaveName = async () => {
    try {
      await updateRetentionProgram(program.id, { display_name: displayName });
      toast.success("Updated");
      onRefresh();
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const handleToggleEnabled = async () => {
    try {
      await updateRetentionProgram(program.id, { enabled: !program.enabled });
      toast.success("Updated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const handleDelete = async () => {
    if (confirm("Delete program?")) {
      await deleteRetentionProgram(program.id);
      toast.success("Deleted");
      onRefresh();
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-visible">
      <div className="p-4 flex items-center justify-between bg-gray-900/30 rounded-t-xl border-b border-gray-800">
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
              className="flex-1 h-8 px-3 rounded-md bg-[#111] border border-gray-700 text-white text-sm"
              autoFocus
            />
          ) : (
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={onToggleExpand}
            >
              <h3 className="text-white font-semibold truncate select-none">
                {program.display_name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Tag size={12} /> {program.service_tag}
                </span>
                <span>•</span>
                <span>{program.steps?.length || 0} steps</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={onQuickAdd}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors mr-2"
            >
              <Plus size={18} />
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleSaveName}
                className="p-2 text-green-500 hover:bg-green-500/10 rounded"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleEnabled}
                className={`p-2 rounded ${program.enabled ? "text-green-500 hover:bg-green-500/10" : "text-gray-600 hover:bg-gray-800"}`}
              >
                {program.enabled ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-[#050505] rounded-b-xl">
          <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
            {sortedSteps && sortedSteps.length > 0 ? (
              sortedSteps.map((step: ProgramStep, index: number) => (
                <div key={step.id} className="relative">
                  <div className="absolute -left-[27px] top-4 h-4 w-4 rounded-full border-2 border-gray-700 bg-[#0A0A0A] z-10 flex items-center justify-center">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${step.enabled ? "bg-blue-500" : "bg-gray-600"}`}
                    />
                  </div>
                  <StepCard
                    step={step}
                    stepNumber={index + 1}
                    programId={program.id}
                    onRefresh={onRefresh}
                    onPreview={() => onPreviewStep(step)}
                  />
                </div>
              ))
            ) : (
              <div className="py-2 text-gray-600 text-sm italic pl-2">
                No steps yet. Click + to add one.
              </div>
            )}
            <div className="relative">
              <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-gray-800" />
              <button
                onClick={onCreateStep}
                className="w-full h-10 border border-dashed border-gray-800 rounded-md text-sm text-gray-500 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Email Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, stepNumber, programId, onRefresh, onPreview }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offsetDays, setOffsetDays] = useState(step.offset_days);
  const [subject, setSubject] = useState(step.template?.subject || "");
  const [heading, setHeading] = useState(step.template?.heading || "");
  const [body, setBody] = useState(step.template?.body || "");
  const [buttonText, setButtonText] = useState(
    step.template?.button_text || "",
  );
  const [buttonUrl, setButtonUrl] = useState(step.template?.button_url || "");
  const [enabled, setEnabled] = useState(step.enabled);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProgramStep(step.id, {
        offset_days: offsetDays,
        enabled,
        template: {
          subject,
          heading,
          body,
          button_text: buttonText,
          button_url: buttonUrl,
        },
      });
      toast.success("Saved");
      onRefresh();
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete step?")) {
      await deleteProgramStep(step.id);
      toast.success("Deleted");
      onRefresh();
    }
  };

  if (isEditing) {
    return (
      <div className="relative bg-[#111] border border-blue-900/50 rounded-lg p-4 shadow-xl z-20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-blue-400">
            Editing Step {stepNumber}
          </h4>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">
                Send on Day
              </label>
              <input
                type="number"
                min="1"
                value={offsetDays}
                onChange={(e) => setOffsetDays(parseInt(e.target.value))}
                className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">
                Status
              </label>
              <select
                value={enabled ? "true" : "false"}
                onChange={(e) => setEnabled(e.target.value === "true")}
                className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
          <hr className="border-gray-800" />
          <div>
            <label className="text-xs text-gray-500 font-bold block mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold block mb-1">
              Heading
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold block mb-1">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">
                Button Link
              </label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="Optional"
                className="w-full h-9 px-3 rounded-md bg-[#1a1a1a] border border-gray-800 text-white text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full h-9 rounded-md bg-white text-black text-sm font-medium mt-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-lg p-5 relative group hover:border-gray-600 transition-all">
      <div className="absolute -left-6 top-6 w-6 h-px bg-gray-800" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onPreview}>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151515] border border-gray-800 text-xs font-mono font-medium text-gray-300">
              <Clock size={12} className="text-blue-500" /> DAY{" "}
              {step.offset_days}
            </span>
            {!step.enabled && (
              <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
                DISABLED
              </span>
            )}
            <span className="text-xs text-gray-600 font-mono">
              STEP {stepNumber}
            </span>
          </div>
          <h4 className="text-base font-semibold text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
            {step.template?.subject || "(No Subject)"}
          </h4>
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {step.template?.body || "(No Content)"}
          </p>
        </div>
        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPreview}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProgramModal({ serviceTags, onClose, onSuccess }: any) {
  const [displayName, setDisplayName] = useState("");
  const [serviceTag, setServiceTag] = useState("");
  const [useExisting, setUseExisting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createRetentionProgram({
        display_name: displayName,
        service_tag: serviceTag,
        enabled: true,
      });
      toast.success("Created");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Create Program
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Display Name (e.g. Botox Treatment)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
          />
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-gray-500 uppercase">
                Service Tag
              </label>
              {serviceTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseExisting(!useExisting)}
                  className="text-xs text-blue-400"
                >
                  {useExisting ? "Create New" : "Use Existing"}
                </button>
              )}
            </div>
            {useExisting && serviceTags.length > 0 ? (
              <select
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
              >
                <option value="">Select...</option>
                {serviceTags.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Tag (e.g. botox)"
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
              />
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-gray-800 rounded-md text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 bg-white text-black rounded-md font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateStepModal({
  programId,
  existingSteps,
  onClose,
  onSuccess,
}: any) {
  const [offsetDays, setOffsetDays] = useState(30);
  const [template, setTemplate] = useState({
    subject: "",
    heading: "Hi {{name}},",
    body: "",
    button_text: "Book Now",
  });
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createProgramStep({
        program_id: programId,
        step_order: existingSteps.length + 1,
        offset_days: offsetDays,
        template,
      });
      toast.success("Added");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 my-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Add Email Step
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Days After Visit
            </label>
            <input
              type="number"
              min="1"
              required
              value={offsetDays}
              onChange={(e) => setOffsetDays(parseInt(e.target.value))}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Subject</label>
            <input
              type="text"
              required
              value={template.subject}
              onChange={(e) =>
                setTemplate({ ...template, subject: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Heading</label>
            <input
              type="text"
              required
              value={template.heading}
              onChange={(e) =>
                setTemplate({ ...template, heading: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Body</label>
            <textarea
              required
              value={template.body}
              onChange={(e) =>
                setTemplate({ ...template, body: e.target.value })
              }
              rows={4}
              className="w-full p-3 rounded-md bg-[#111] border border-gray-800 text-white resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Button</label>
            <input
              type="text"
              required
              value={template.button_text}
              onChange={(e) =>
                setTemplate({ ...template, button_text: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-gray-800 rounded-md text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 bg-white text-black rounded-md font-medium"
            >
              Add Step
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
