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

  // Obtener programas disponibles
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await getRetentionPrograms();
        setPrograms(data.filter((p) => p.enabled));
      } catch (e) {
        console.error("Error cargando programas", e);
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
        // Actualizar
        const { data, error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", initialData.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast.success("Cliente actualizado");
      } else {
        // Crear
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
        toast.success("Cliente añadido");
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Editar Cliente" : "Añadir Cliente"}
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
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
              placeholder="ej. Juan Pérez"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white"
              placeholder="ej. juan@email.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Fecha Última Visita
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
              Campaña Asignada (Programa)
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
                <option value="">(Ninguna - Usar Global)</option>
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
                Coincide con programa:{" "}
                {
                  programs.find((p) => p.service_tag === formData.service)
                    ?.display_name
                }
              </p>
            )}
            <p className="text-[10px] text-gray-600 mt-1">
              Seleccionar una campaña asigna automáticamente la "Etiqueta de
              Servicio" correspondiente.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : initialData ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
