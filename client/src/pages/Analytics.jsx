import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import { leadService } from "../api/leadApi";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    whatsappSent: 0,
    whatsappFailed: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    // In a real app, this would be a dedicated stats endpoint
    // For now, we'll derive it from the general leads list
    const fetchStats = async () => {
      try {
        const response = await leadService.getLeads({ limit: 1000 });
        const leads = response.data.leads;
        const sent = leads.filter((l) => l.whatsapp_sent).length;
        const failed = 0; // Derived from MessageLogs in reality

        setStats({
          totalLeads: response.data.pagination.total,
          whatsappSent: sent,
          whatsappFailed: failed,
          conversionRate:
            response.data.pagination.total > 0
              ? ((sent / response.data.pagination.total) * 100).toFixed(1)
              : 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" /> Enterprise
          Analytics
        </h2>
        <p className="text-slate-500 text-sm">
          Monitor your outreach performance and lead growth
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl space-y-2 border border-blue-500/10 shadow-xl shadow-blue-500/5 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Leads
            </span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalLeads}
          </div>
          <div className="text-[10px] text-emerald-500 font-bold">
            +12% from last week
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-2 border border-emerald-500/10 shadow-xl shadow-emerald-500/5 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              WhatsApp Sent
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.whatsappSent}
          </div>
          <div className="text-[10px] text-emerald-500 font-bold">
            Successful deliveries
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-2 border border-amber-500/10 shadow-xl shadow-amber-500/5 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Failed
            </span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.whatsappFailed}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Retry required
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-2 border border-primary-500/10 shadow-xl shadow-primary-500/5 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conversion %
            </span>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.conversionRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.conversionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual placeholder for detailed charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
          <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">Leads over Time (Coming Soon)</p>
          <p className="text-xs opacity-50">
            Integration with Chart.js pending
          </p>
        </div>
        <div className="glass rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
          <PieChart className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">
            Geographic Distribution (Coming Soon)
          </p>
          <p className="text-xs opacity-50">
            Spatial data visualization module
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
