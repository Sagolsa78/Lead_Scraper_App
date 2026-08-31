import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Database, Code, Shield } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 font-sans transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
        {/* Header */}
        <div className="space-y-4 border-b border-slate-200 dark:border-white/10 pb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-500/10 rounded-2xl">
              <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">LeadFinder Documentation</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Learn how to integrate and build with our autonomous lead extraction engine.</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6 glow-primary">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold">API Reference</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Integrate LeadFinder directly into your existing workflows using our RESTful API. Generate leads, check job status, and manage your CRM data programmatically.
            </p>
            <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
              POST /api/leads/generate<br/>
              GET /api/leads/jobs/:id<br/>
              GET /api/leads
            </div>
          </div>

          <div className="glass rounded-3xl p-6 glow-primary">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold">PostgreSQL Sync</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              For enterprise clients, LeadFinder offers direct PostgreSQL synchronization, streaming high-intent leads straight into your internal data warehouse in real-time.
            </p>
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors">
              Request DB Credentials
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 glow-primary">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold">System Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/50 dark:border-white/5">
              <span className="font-semibold text-sm">Google Places Engine</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/50 dark:border-white/5">
              <span className="font-semibold text-sm">PostgreSQL Cluster</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/50 dark:border-white/5">
              <span className="font-semibold text-sm">WhatsApp Meta API</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Docs;
