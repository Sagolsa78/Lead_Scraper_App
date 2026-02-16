import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  FileSpreadsheet,
  ListFilter,
} from "lucide-react";
import { cn } from "../utils/cn";

const StatsCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="glass p-6 rounded-2xl flex items-center gap-4">
    <div className={cn("p-3 rounded-xl", colorClass)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-bold dark:text-white">{value}</p>
    </div>
  </div>
);

const ResultSummary = ({ results }) => {
  if (!results) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StatsCard
        title="Total Fetched"
        value={results.totalFetched}
        icon={ListFilter}
        colorClass="bg-blue-500"
      />
      <StatsCard
        title="Valid Leads"
        value={results.validLeadsCount}
        icon={CheckCircle2}
        colorClass="bg-emerald-500"
      />
      <StatsCard
        title="Duplicates Removed"
        value={results.duplicatesRemoved}
        icon={AlertCircle}
        colorClass="bg-orange-500"
      />
      <StatsCard
        title="Saved to Sheet"
        value={results.savedToSheet}
        icon={FileSpreadsheet}
        colorClass="bg-green-600"
      />
    </div>
  );
};

export default ResultSummary;
