"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Unplug,
  AlertCircle,
  FileSpreadsheet,
  Download,
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

  const handleDisconnectGoogle = async () => {
    if (!confirm("Are you sure? This will stop all email automation.")) return;
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
      toast.error("Failed to disconnect");
    } else {
      setGoogleEmail(null);
      toast.success("Google account disconnected");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid gap-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your email connection and data sources.
          </p>
        </div>
      </div>

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
                Connect Google Account
              </a>
            </div>
          )}
        </div>
      </div>

      {/* EXCEL SYNC */}
      <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-gray-400" />
            Desktop Sync (Excel)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">
            Download the connector to sync your local Excel files automatically.
          </p>
          <a
            href="/api/download-connector"
            target="_blank"
            className="inline-flex h-10 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-2"
          >
            <Download size={16} /> Download Connector
          </a>
        </div>
      </div>
    </div>
  );
}
