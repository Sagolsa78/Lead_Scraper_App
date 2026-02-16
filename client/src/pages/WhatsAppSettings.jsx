import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Globe,
  MessageSquare,
  Save,
  Info,
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
      <div className="animate-pulse space-y-4 shadow-xl">
        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/4"></div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" /> WhatsApp Settings
        </h2>
        <p className="text-slate-500 text-sm">
          Configure how you send messages to your leads
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass rounded-3xl p-8 space-y-6 border border-primary-500/10 shadow-xl shadow-primary-500/5">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Message Delivery Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, whatsappMode: "manual" })
                }
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                  settings.whatsappMode === "manual"
                    ? "border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 ring-4 ring-primary-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${settings.whatsappMode === "manual" ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm text-slate-900 dark:text-white">
                    Manual Mode
                  </span>
                  <span className="text-xs text-slate-500">
                    Opens wa.me links in a new tab. No API configuration needed.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, whatsappMode: "cloud" })
                }
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                  settings.whatsappMode === "cloud"
                    ? "border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 ring-4 ring-primary-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${settings.whatsappMode === "cloud" ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm text-slate-900 dark:text-white">
                    Meta Cloud API
                  </span>
                  <span className="text-xs text-slate-500">
                    Automated messaging using Meta's official API for bulk
                    sending.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {settings.whatsappMode === "cloud" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 flex gap-3 text-amber-700 dark:text-amber-400">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase mb-1">
                    Security Note
                  </p>
                  <p className="text-xs">
                    Your Meta token is encrypted at rest in our database using
                    industry-standard AES-256.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Meta Permanent Access Token
                </label>
                <input
                  type="password"
                  placeholder="Enter your system user access token..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  value={settings.whatsappToken}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsappToken: e.target.value })
                  }
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 flex gap-3 text-blue-700 dark:text-blue-400">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold uppercase">Setup Required</p>
                  <p>
                    Ensure you have configured{" "}
                    <strong>WHATSAPP_PHONE_NUMBER_ID</strong> in your backend
                    .env file.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              className="w-full bg-primary-600 text-white rounded-xl py-4 font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
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
