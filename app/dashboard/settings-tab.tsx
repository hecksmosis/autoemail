"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Unplug,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Lock,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsTabProps {
  tenantId: string;
  initialData: {
    googleEmail: string | null;
  };
}

export default function SettingsTab({
  tenantId,
  initialData,
}: SettingsTabProps) {
  const supabase = createClient();
  const [googleEmail, setGoogleEmail] = useState<string | null>(
    initialData.googleEmail,
  );

  const [disconnecting, setDisconnecting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleDisconnectGoogle = async () => {
    if (
      !confirm(
        "¿Estás seguro? Esto detendrá toda la automatización de correos.",
      )
    )
      return;
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
      toast.error("Error al desconectar");
    } else {
      setGoogleEmail(null);
      toast.success("Cuenta de Google desconectada");
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setUpdatingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setUpdatingPass(false);
    if (error) {
      toast.error("Error al actualizar contraseña: " + error.message);
    } else {
      toast.success("Contraseña actualizada correctamente");
      setNewPassword("");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid gap-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tus conexiones, seguridad y fuentes de datos.
          </p>
        </div>
      </div>

      {/* TARJETA OAUTH */}
      <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-gray-400" />
            Proveedor de Correo
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conecta la cuenta desde donde enviarás los correos.
          </p>
        </div>
        <div className="p-6">
          {googleEmail ? (
            <div className="flex items-center justify-between p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={20} />
                <div>
                  <p className="text-sm font-medium text-green-400">
                    Conectado a Google
                  </p>
                  <p className="text-xs text-green-500/70 mt-0.5">
                    Enviando como: {googleEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                disabled={disconnecting}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Desconectar"
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
                  Sin conexión. Los correos fallarán al enviarse.
                </p>
              </div>
              <a
                href="/api/auth/google/login"
                className="inline-flex h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
              >
                Conectar Cuenta de Google
              </a>
            </div>
          )}
        </div>
      </div>

      {/* SEGURIDAD / CONTRASEÑA */}
      <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Lock size={20} className="text-gray-400" />
            Seguridad
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Actualiza tu contraseña de acceso al panel.
          </p>
        </div>
        <form
          onSubmit={handlePasswordUpdate}
          className="p-6 flex gap-3 items-end"
        >
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Nueva Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={updatingPass || !newPassword}
            className="h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updatingPass ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Actualizar
          </button>
        </form>
      </div>

      {/* SINCRONIZACIÓN EXCEL */}
      <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-gray-400" />
            Sincronización Escritorio (Excel)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">
            Descarga el conector para sincronizar tus archivos Excel locales
            automáticamente.
          </p>
          <a
            href="/api/download-connector"
            target="_blank"
            className="inline-flex h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
          >
            <Download size={16} /> Descargar Conector
          </a>
        </div>
      </div>
    </div>
  );
}
