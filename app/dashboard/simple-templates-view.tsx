"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SimpleTemplatesView({
  tenantId,
}: {
  tenantId: string;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State
  const [delayDays, setDelayDays] = useState(1);
  const [template, setTemplate] = useState({
    subject: "",
    heading: "",
    body: "",
    button_text: "",
  });

  useEffect(() => {
    async function load() {
      // 1. Fetch Tenant Settings
      const { data: tenant } = await supabase
        .from("tenants")
        .select("default_review_delay")
        .eq("id", tenantId)
        .single();

      if (tenant) setDelayDays(tenant.default_review_delay || 1);

      // 2. Fetch Template
      const { data: tmpl } = await supabase
        .from("email_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("type", "review") // The default global type
        .single();

      if (tmpl) {
        setTemplate({
          subject: tmpl.subject,
          heading: tmpl.heading,
          body: tmpl.body,
          button_text: tmpl.button_text,
        });
      } else {
        // Defaults
        setTemplate({
          subject: "How was your visit?",
          heading: "Hi {{name}}! 👋",
          body: "Thanks for visiting us recently. We'd love to know how we did.",
          button_text: "Leave a Review",
        });
      }
      setLoading(false);
    }
    load();
  }, [tenantId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save Delay Setting
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({ default_review_delay: delayDays })
        .eq("id", tenantId);
      if (tenantError) throw tenantError;

      // 2. Save Template
      const { error: tmplError } = await supabase
        .from("email_templates")
        .upsert(
          {
            tenant_id: tenantId,
            type: "review",
            ...template,
          },
          { onConflict: "tenant_id,type" },
        );
      if (tmplError) throw tmplError;

      toast.success("Settings saved successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Timing Card */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
            <Clock size={20} className="text-blue-400" />
            Timing Configuration
          </h3>

          <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-6">
            <div className="flex gap-3">
              <Info className="text-blue-400 shrink-0 mt-1" size={18} />
              <p className="text-sm text-blue-300">
                This email is sent to <strong>all customers</strong> who do not
                have a specific service program assigned.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Send email{" "}
                <strong>
                  {delayDays} day{delayDays !== 1 ? "s" : ""}
                </strong>{" "}
                after visit
              </label>
              <input
                type="range"
                min="1"
                max="14"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value))}
                className="w-full accent-white"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>1 Day (Next Day)</span>
                <span>7 Days</span>
                <span>14 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Email Subject
            </label>
            <input
              type="text"
              value={template.subject}
              onChange={(e) =>
                setTemplate({ ...template, subject: e.target.value })
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
              value={template.heading}
              onChange={(e) =>
                setTemplate({ ...template, heading: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Body
            </label>
            <textarea
              rows={6}
              value={template.body}
              onChange={(e) =>
                setTemplate({ ...template, body: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Button Text
            </label>
            <input
              type="text"
              value={template.button_text}
              onChange={(e) =>
                setTemplate({ ...template, button_text: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-10 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Preview Column */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-start relative">
        <div className="bg-white text-black w-full rounded-lg shadow-2xl overflow-hidden mt-8 sticky top-8">
          <div className="bg-gray-100 p-4 border-b border-gray-200 text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>Subject:</span>{" "}
              <span className="text-gray-900 font-medium">
                {template.subject}
              </span>
            </div>
          </div>
          <div className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {template.heading.replace("{{name}}", "John")}
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {template.body}
            </p>
            <button className="bg-black text-white font-bold py-3 px-6 rounded-md">
              {template.button_text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
