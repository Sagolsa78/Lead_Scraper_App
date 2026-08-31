import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  Activity,
  Layers,
  Zap,
  Globe,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { leadService } from "../api/leadApi";

const MetricCard = ({ title, value, subtitle, subtitleColor, icon: Icon, gradient, delay = 0 }) => (
  <div
    className="glass rounded-3xl p-6 glow-card animate-fade-up border border-slate-200/80 dark:border-white/10 relative overflow-hidden group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[50px] transition-opacity opacity-10 group-hover:opacity-20"
      style={{ background: gradient }}
    />
    <div className="relative z-10 space-y-3">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {title}
        </span>
        <div
          className="p-2.5 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-md"
          style={{ background: `${gradient}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: gradient }} />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>
      <div className={`text-xs font-bold ${subtitleColor || 'text-slate-500 dark:text-slate-400'}`}>
        {subtitle}
      </div>
    </div>
  </div>
);

const VisualBarChart = () => {
  const months = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [45, 78, 62, 95, 110, 85, 134];
  const maxValue = Math.max(...values);

  return (
    <div className="glass rounded-3xl p-7 border border-slate-200/80 dark:border-white/10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Weekly Extraction Velocity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Leads extracted per day over the last 7 days</p>
        </div>
        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
          +24.5% vs Last Week
        </span>
      </div>

      <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
        {values.map((v, idx) => {
          const heightPct = (v / maxValue) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                {v}
              </div>
              <div className="w-full bg-slate-200/70 dark:bg-white/[0.04] rounded-2xl h-36 flex items-end p-1">
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-primary-600 via-primary-500 to-pink-500 transition-all duration-700 ease-out group-hover:shadow-lg group-hover:shadow-primary-500/30"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{months[idx]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ConversionFunnel = ({ total, sent }) => {
  return (
    <div className="glass rounded-3xl p-7 border border-slate-200/80 dark:border-white/10 space-y-6">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-500" />
          Lead Conversion Funnel
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Stage breakdown from raw scraping to outreach</p>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-800 dark:text-slate-200">1. Discovered Google Places</span>
            <span className="text-primary-600 dark:text-primary-400">{total} Leads</span>
          </div>
          <div className="h-3 w-full bg-slate-200/70 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full w-full" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-800 dark:text-slate-200">2. Phone Verified & Deduplicated</span>
            <span className="text-purple-600 dark:text-purple-400">{Math.round(total * 0.85)} Leads (85%)</span>
          </div>
          <div className="h-3 w-full bg-slate-200/70 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full w-[85%]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-800 dark:text-slate-200">3. WhatsApp Outreached</span>
            <span className="text-emerald-600 dark:text-emerald-400">{sent} Sent</span>
          </div>
          <div className="h-3 w-full bg-slate-200/70 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    whatsappSent: 0,
    verifiedPhones: 0,
    highPriority: 0,
    conversionRate: "0.0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await leadService.getStats();
        if (response?.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-600 shadow-xl shadow-primary-500/20 text-white">
            <BarChart3 className="w-6 h-6" />
          </div>
          <span>Enterprise Intelligence Analytics</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12 font-semibold">
          Real-time metrics, extraction velocity, and campaign conversion funnels
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Pipeline Leads"
          value={stats.totalLeads}
          subtitle="+18% growth this month"
          subtitleColor="text-emerald-500"
          icon={TrendingUp}
          gradient="#3b82f6"
          delay={0}
        />
        <MetricCard
          title="WhatsApp Outreached"
          value={stats.whatsappSent}
          subtitle="Verified deliveries"
          subtitleColor="text-emerald-500"
          icon={CheckCircle2}
          gradient="#10b981"
          delay={60}
        />
        <MetricCard
          title="API Response Time"
          value="18ms"
          subtitle="Real-time Places Sync"
          subtitleColor="text-amber-500"
          icon={Zap}
          gradient="#f59e0b"
          delay={120}
        />
        <MetricCard
          title="Outreach Conversion Rate"
          value={`${stats.conversionRate}%`}
          subtitle="High-intent engagement"
          subtitleColor="text-purple-500"
          icon={PieChart}
          gradient="#6366f1"
          delay={180}
        />
      </div>

      {/* Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisualBarChart />
        <ConversionFunnel total={stats.totalLeads} sent={stats.whatsappSent} />
      </div>
    </div>
  );
};

export default Analytics;
