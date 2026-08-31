import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  FileSpreadsheet,
  ListFilter,
  TrendingUp,
} from "lucide-react";
import { cn } from "../utils/cn";

const StatsCard = ({ title, value, icon: Icon, gradient, delay = 0 }) => (
  <div
    className="stat-card animate-fade-up group border border-slate-200/80 dark:border-white/10"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
      style={{ background: gradient }}
    />
    <div className="flex items-center gap-4 relative z-10">
      <div
        className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{ background: `${gradient}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: gradient }} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ResultSummary = ({ results }) => {
  if (!results) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Fetched"
        value={results.totalFetched}
        icon={ListFilter}
        gradient="#3b82f6"
        delay={0}
      />
      <StatsCard
        title="Valid Leads"
        value={results.validLeadsCount}
        icon={CheckCircle2}
        gradient="#10b981"
        delay={50}
      />
      <StatsCard
        title="Duplicates Removed"
        value={results.duplicatesRemoved}
        icon={AlertCircle}
        gradient="#f59e0b"
        delay={100}
      />
      <StatsCard
        title="Saved to Sheet"
        value={results.savedToSheet}
        icon={FileSpreadsheet}
        gradient="#059669"
        delay={150}
      />
    </div>
  );
};

export default ResultSummary;
