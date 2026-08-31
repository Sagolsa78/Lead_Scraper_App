import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Globe,
  MessageSquare,
  Save,
  Info,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { leadService } from "../api/leadApi";
import { toast } from "react-hot-toast";

const WhatsAppSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsappMode: "manual",
    whatsappToken: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await leadService.getSettings();
      setSettings({
        whatsappMode: response.data.whatsappMode,
        whatsappToken:
          response.data.whatsappToken === "********"
            ? ""
            : response.data.whatsappToken,
      });
    } catch (error) {
      // toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leadService.updateSettings({
        mode: settings.whatsappMode,
        token: settings.whatsappToken || undefined,
      });
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-12 skeleton rounded-xl w-1/4" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-500/10">
            <Settings className="w-5 h-5 text-primary-500" />
          </div>
          WhatsApp Settings
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-10">
          Configure how you send messages to your leads
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass glow-card rounded-2xl p-8 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Message Delivery Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual Mode */}
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, whatsappMode: "manual" })
                }
                className={`group flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer ${
                  settings.whatsappMode === "manual"
                    ? "border-primary-500 bg-primary-50/80 dark:bg-primary-500/10 shadow-md shadow-primary-500/10"
                    : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] bg-slate-50/50 dark:bg-transparent"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    settings.whatsappMode === "manual"
                      ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                      : "bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900 dark:text-white">
                    Manual Mode
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                    Opens wa.me links in a new tab. No API config needed.
                  </span>
                  {settings.whatsappMode === "manual" && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </div>
                  )}
                </div>
              </button>

              {/* Cloud API Mode */}
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, whatsappMode: "cloud" })
                }
                className={`group flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer ${
                  settings.whatsappMode === "cloud"
                    ? "border-primary-500 bg-primary-50/80 dark:bg-primary-500/10 shadow-md shadow-primary-500/10"
                    : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] bg-slate-50/50 dark:bg-transparent"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    settings.whatsappMode === "cloud"
                      ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                      : "bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-sm text-slate-900 dark:text-white">
                    Meta Cloud API
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block leading-relaxed">
                    Automated messaging via Meta's official API for bulk sending.
                  </span>
                  {settings.whatsappMode === "cloud" && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Cloud API Settings */}
          {settings.whatsappMode === "cloud" && (
            <div className="space-y-4 animate-fade-up">
              <div className="p-4 bg-amber-50/80 dark:bg-amber-500/5 rounded-xl border border-amber-200/60 dark:border-amber-500/15 flex gap-3">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider mb-1">
                    Security Note
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
                    Your Meta token is encrypted at rest using
                    industry-standard AES-256.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Meta Permanent Access Token
                </label>
                <input
                  type="password"
                  placeholder="Enter your system user access token..."
                  className="input-field py-3"
                  value={settings.whatsappToken}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsappToken: e.target.value })
                  }
                />
              </div>

              <div className="p-4 bg-blue-50/80 dark:bg-blue-500/5 rounded-xl border border-blue-200/60 dark:border-blue-500/15 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[11px] uppercase text-blue-700 dark:text-blue-400 tracking-wider">Setup Required</p>
                  <p className="text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                    Ensure you have configured{" "}
                    <code className="font-mono bg-blue-100 dark:bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">WHATSAPP_PHONE_NUMBER_ID</code> in your backend .env file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              disabled={saving}
              className="w-full btn btn-primary py-3.5 font-bold flex items-center justify-center gap-2.5 group"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
              )}
              Save All Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WhatsAppSettings;
