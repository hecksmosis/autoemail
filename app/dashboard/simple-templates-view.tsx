"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Save,
  Clock,
  Info,
  Link as LinkIcon,
  ToggleRight,
  ToggleLeft,
  CircleHelp,
} from "lucide-react";
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

  // Input Refs for cursor positioning
  const subjectRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [delayDays, setDelayDays] = useState(1);
  const [enableGlobal, setEnableGlobal] = useState(true);

  const [template, setTemplate] = useState({
    subject: "",
    heading: "",
    body: "",
    button_text: "",
    button_url: "",
  });

  useEffect(() => {
    async function load() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("default_review_delay, enable_global_review_email")
        .eq("id", tenantId)
        .single();
      if (tenant) {
        setDelayDays(tenant.default_review_delay || 1);
        setEnableGlobal(tenant.enable_global_review_email ?? true);
      }

      const { data: tmpl } = await supabase
        .from("email_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("type", "review")
        .single();
      if (tmpl) {
        setTemplate({
          subject: tmpl.subject,
          heading: tmpl.heading,
          body: tmpl.body,
          button_text: tmpl.button_text,
          button_url: tmpl.button_url || "",
        });
      } else {
        setTemplate({
          subject: "¿Qué tal tu visita?",
          heading: "¡Hola {{name}}! 👋",
          body: "Gracias por visitarnos recientemente. Nos encantaría saber qué te pareció.",
          button_text: "Dejar Reseña",
          button_url: "",
        });
      }
      setLoading(false);
    }
    load();
  }, [tenantId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from("tenants")
        .update({
          default_review_delay: delayDays,
          enable_global_review_email: enableGlobal,
        })
        .eq("id", tenantId);
      await supabase
        .from("email_templates")
        .upsert(
          { tenant_id: tenantId, type: "review", ...template },
          { onConflict: "tenant_id,type" },
        );
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Fixed Type Error: using 'any' to allow both Input and TextArea refs
  const insertPlaceholder = (
    field: "subject" | "heading" | "body",
    ref: any,
  ) => {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = el.value;
    const newText = text.substring(0, start) + "{{name}}" + text.substring(end);

    setTemplate((prev) => ({ ...prev, [field]: newText }));

    // Restore focus and move cursor after the inserted tag
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 8, start + 8);
    }, 0);
  };

  if (loading)
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );

  return (
    <div className="grid lg:grid-cols-3 gap-6 relative items-start">
      <div className="lg:col-span-2 space-y-6">
        {/* AUTOMATION STATUS */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Automatización Global
            </h3>
            <button
              onClick={() => setEnableGlobal(!enableGlobal)}
              className={`transition-colors ${enableGlobal ? "text-green-500" : "text-gray-600"}`}
            >
              {enableGlobal ? (
                <ToggleRight size={36} />
              ) : (
                <ToggleLeft size={36} />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            {enableGlobal
              ? "Activo: Se enviarán correos de reseña automáticamente."
              : "Pausado: No se enviarán correos de reseña generales."}
          </p>
        </div>

        {/* TIMING */}
        <div
          className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 transition-opacity duration-200"
          style={{ opacity: enableGlobal ? 1 : 0.5 }}
        >
          <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-6">
            <div className="flex gap-3">
              <Info className="text-blue-400 shrink-0 mt-1" size={18} />
              <p className="text-sm text-blue-300">
                Se envía a <strong>todos los clientes</strong> sin programa
                específico.
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Enviar correo{" "}
              <strong>
                {delayDays} día{delayDays !== 1 ? "s" : ""}
              </strong>{" "}
              después de la visita
            </label>
            <input
              type="range"
              min="1"
              max="14"
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value))}
              disabled={!enableGlobal}
              className="w-full accent-white"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>1 Día</span>
              <span>7 Días</span>
              <span>14 Días</span>
            </div>
          </div>
        </div>

        {/* CONTENT EDITOR */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 space-y-5">
          {/* SUBJECT */}
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Asunto del Correo
            </label>
            <input
              ref={subjectRef}
              type="text"
              value={template.subject}
              onChange={(e) =>
                setTemplate({ ...template, subject: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white text-lg font-medium"
              placeholder="Ej. Gracias por tu visita"
            />
            <NamePlaceholderControl
              onInsert={() => insertPlaceholder("subject", subjectRef)}
            />
          </div>

          {/* HEADING */}
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Encabezado
            </label>
            <input
              ref={headingRef}
              type="text"
              value={template.heading}
              onChange={(e) =>
                setTemplate({ ...template, heading: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
            <NamePlaceholderControl
              onInsert={() => insertPlaceholder("heading", headingRef)}
            />
          </div>

          {/* BODY */}
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold text-gray-500">
              Cuerpo
            </label>
            <textarea
              ref={bodyRef}
              rows={6}
              value={template.body}
              onChange={(e) =>
                setTemplate({ ...template, body: e.target.value })
              }
              className="w-full bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white resize-none"
            />
            <NamePlaceholderControl
              onInsert={() => insertPlaceholder("body", bodyRef)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-500">
                Texto del Botón
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
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-gray-500">
                Enlace del Botón
              </label>
              <div className="relative">
                <LinkIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="url"
                  value={template.button_url || ""}
                  onChange={(e) =>
                    setTemplate({ ...template, button_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-[#111] border border-gray-800 rounded-md pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white text-sm"
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            Si el enlace se deja vacío, usará el enlace de Google Reviews en
            Configuración.
          </p>

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
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="lg:col-span-1 sticky top-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-start relative">
          <div className="text-xs text-gray-500 mb-4 font-mono w-full text-center">
            VISTA PREVIA
          </div>
          <div className="bg-white text-black w-full rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-100 p-4 border-b border-gray-200 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Asunto:</span>{" "}
                <span className="text-gray-900 font-medium truncate ml-2">
                  {template.subject.replace("{{name}}", "Juan")}
                </span>
              </div>
            </div>
            <div className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {template.heading.replace("{{name}}", "Juan")}
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                {template.body.replace("{{name}}", "Juan")}
              </p>
              <button className="bg-black text-white font-bold py-3 px-6 rounded-md text-sm shadow-md">
                {template.button_text}
              </button>
              <p className="text-[10px] text-gray-400 mt-4 border-t pt-4">
                Enviado por Tu Negocio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NamePlaceholderControl({ onInsert }: { onInsert: () => void }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        onClick={onInsert}
        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-0.5 rounded transition-colors border border-gray-700"
      >
        + Insertar Nombre
      </button>
      <div className="group relative flex items-center">
        <CircleHelp size={14} className="text-gray-600 cursor-help" />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2 bg-gray-900 border border-gray-700 rounded-md text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
          El código <strong>{`{{name}}`}</strong> será reemplazado
          automáticamente por el nombre real del cliente (ej. "Juan") al enviar
          el correo.
        </div>
      </div>
    </div>
  );
}
