import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Zap,
  Loader2,
  Star,
  Facebook,
  Instagram,
  Linkedin,
  ShieldCheck,
  Calendar,
  Globe,
  Sparkles,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { leadService } from "../api/leadApi";
import { useJobs } from "../context/JobContext";
import { toast } from "react-hot-toast";

const LeadsDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    city: "",
    keyword: "",
    subCategory: "",
    whatsapp_status: "",
    search: "",
    sortBy: "createdAt",
    order: "desc",
  });
  const [smartSearch, setSmartSearch] = useState({
    city: "",
    businessType: "",
    limit: 150,
  });
  const [isSearching, setIsSearching] = useState(false);
  const { runningJobs, isEngineRunning, completedJobs, cancelJob } = useJobs();

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const response = await leadService.getLeads({ ...filters, page });
      setLeads(response.data.leads);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(1), 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Auto-refresh when a job completes
  useEffect(() => {
    if (completedJobs.length > 0) {
      fetchLeads(1);
    }
  }, [completedJobs.length]);

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      order: prev.sortBy === field && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ field }) => {
    if (filters.sortBy !== field) return <span className="text-slate-300 dark:text-slate-600 ml-1 text-[10px]">↕</span>;
    return <span className="text-primary-500 ml-1 text-[10px]">{filters.order === "desc" ? "↓" : "↑"}</span>;
  };

  const handleSendWhatsApp = async (leadId) => {
    try {
      const response = await leadService.sendWhatsApp({ leadId });
      if (response.data.mode === "manual") {
        window.open(response.data.url, "_blank");
      } else {
        toast.success("Message sent via Cloud API!");
        fetchLeads(pagination.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleSmartSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const response = await leadService.searchLeads(smartSearch);
      const resultData = response.data;

      if (resultData.validLeadsCount === 0) {
        toast("No new leads found matching the criteria in this area.", {
          icon: "ℹ️",
        });
      } else {
        toast.success(
          `Smart search complete! Found ${resultData.validLeadsCount} new leads. Saved ${resultData.savedToPostgres} to database.`,
        );
      }
      fetchLeads(1);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Smart search failed";
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-600 shadow-xl shadow-primary-500/20 text-white">
              <Users className="w-6 h-6" />
            </div>
            <span>CRM Leads Database</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-12 font-semibold">
            Real-time pipeline management, WhatsApp outreach & B2B verification
          </p>
        </div>
      </div>

      {/* Active Engine Banner on Dashboard */}
      <AnimatePresence>
        {isEngineRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl overflow-hidden border border-primary-500/20 shadow-lg shadow-primary-500/10"
          >
            <div className="bg-gradient-to-r from-primary-500/10 via-violet-500/10 to-pink-500/10 dark:from-primary-500/[0.06] dark:via-violet-500/[0.06] dark:to-pink-500/[0.06] backdrop-blur-md p-5">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full border-2 border-primary-300 dark:border-primary-600 border-t-primary-600 dark:border-t-primary-400 animate-spin" />
                  <Activity className="w-4 h-4 absolute inset-0 m-auto text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500" />
                    </span>
                    Extraction Engine is Running
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {runningJobs.length} active job{runningJobs.length > 1 ? "s" : ""} — New leads will appear here automatically when complete
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {runningJobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex items-center gap-2 bg-white/60 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2"
                    >
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                          {j.data?.keyword || "All"} · {j.data?.city || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary-500 to-pink-500 rounded-full"
                              animate={{ width: `${j.progress || 3}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400">
                            {j.progress || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="pl-2 ml-2 border-l border-slate-200 dark:border-white/10 flex items-center justify-center">
                        <button
                          onClick={() => cancelJob(j.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Stop Engine"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up stagger-1">
        <div className="glass rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{pagination.total || leads.length}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Phones</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {leads.filter(l => l.phoneValid).length}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {leads.filter(l => l.priority === 'HIGH').length}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp Sent</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {leads.filter(l => l.whatsapp_sent).length}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Search Section */}
      <div className="glass rounded-3xl p-6 glow-card animate-fade-up stagger-2 border border-white/60 dark:border-white/10 shadow-xl">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          Smart Lead Search
          <span className="ml-2 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 uppercase tracking-widest">
            Autonomous Engine
          </span>
        </h3>
        <form
          onSubmit={handleSmartSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            type="text"
            placeholder="Target City (e.g. Lucknow)"
            required
            className="input-field"
            value={smartSearch.city}
            onChange={(e) =>
              setSmartSearch({ ...smartSearch, city: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Business Category (e.g. restaurant)"
            required
            className="input-field"
            value={smartSearch.businessType}
            onChange={(e) =>
              setSmartSearch({ ...smartSearch, businessType: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Extraction Limit (Max 500)"
            max="500"
            min="1"
            className="input-field"
            value={smartSearch.limit}
            onChange={(e) =>
              setSmartSearch({
                ...smartSearch,
                limit: parseInt(e.target.value),
              })
            }
          />
          <button
            type="submit"
            disabled={isSearching}
            className="btn btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" /> Start Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 animate-fade-up stagger-3 border border-white/60 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="     Search business or phone..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="      Filter by city..."
              className="input-field pl-10"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
          </div>
          <input
            type="text"
            placeholder="Filter by category..."
            className="input-field"
            value={filters.subCategory}
            onChange={(e) =>
              setFilters({ ...filters, subCategory: e.target.value })
            }
          />
          <select
            className="input-field cursor-pointer"
            value={filters.whatsapp_status}
            onChange={(e) =>
              setFilters({ ...filters, whatsapp_status: e.target.value })
            }
          >
            <option value="">All WhatsApp Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={() => fetchLeads(1)}
            className="btn btn-primary text-sm font-bold flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass rounded-2xl overflow-hidden overflow-x-auto animate-fade-up stagger-3">
        <table className="data-table">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("name")}>
                Business <SortIcon field="name" />
              </th>
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("priority")}>
                Priority <SortIcon field="priority" />
              </th>
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("status")}>
                Status <SortIcon field="status" />
              </th>
              <th>Phone / Valid</th>
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("socialScore")}>
                Social / Web <SortIcon field="socialScore" />
              </th>
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("rating")}>
                Rating <SortIcon field="rating" />
              </th>
              <th className="cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handleSort("createdAt")}>
                Created <SortIcon field="createdAt" />
              </th>
              <th>WhatsApp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan="9" className="px-5 py-3">
                    <div className="h-10 skeleton rounded-lg" />
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">No leads found matching current filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="group">
                  <td>
                    <div className="font-semibold text-slate-900 dark:text-white uppercase text-sm truncate max-w-[200px]">
                      {lead.name}
                    </div>
                    <div className="text-[10px] text-primary-500 font-bold uppercase tracking-wider mt-0.5">
                      {lead.businessType} • {lead.subCategory || "General"}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {lead.city}
                    </div>
                    {lead.googleMapsUrl && (
                      <a
                        href={lead.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:text-blue-400 flex items-center gap-1 mt-1 transition-colors"
                      >
                        View on Maps <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        lead.priority === "HIGH"
                          ? "priority-badge-high"
                          : lead.priority === "MEDIUM"
                            ? "priority-badge-medium"
                            : "priority-badge-low"
                      }`}
                    >
                      {lead.priority || "LOW"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {lead.finalScore?.toFixed(1) || "0.0"} pts
                    </div>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider
                        ${
                          lead.status === "converted"
                            ? "bg-green-50 text-green-700 border border-green-200/60 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/20"
                            : lead.status === "contacted"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/20"
                              : lead.status === "qualified"
                                ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-500/20"
                                : "bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50"
                        }
                     `}
                    >
                      {lead.status || "New"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                        {lead.phone}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {lead.phoneValid ? (
                          <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                            Unverified
                          </span>
                        )}
                        {lead.whatsappEnabled && (
                          <span className="text-[10px] flex items-center gap-0.5 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5 rounded-md border border-green-200/50 dark:border-green-500/20">
                            <MessageSquare className="w-3 h-3" /> WA
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const statusColors = {
                          STRONG: "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/20",
                          ACTIVE: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/20",
                          WEAK: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/20",
                          NONE: "bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50",
                        };
                        const status = lead.socialStatus || "NONE";
                        const score = lead.socialScore || 0;
                        const colorClass = statusColors[status] || statusColors["NONE"];

                        return (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                              {status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{score}/80</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2 text-slate-400">
                        {lead.website !== "N/A" && lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-primary-500 transition-colors" title="Website">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Globe className="w-3.5 h-3.5 opacity-20" />
                        )}
                        {lead.instagramProfile ? (
                          <a href={lead.instagramProfile} target="_blank" rel="noreferrer" className="hover:text-pink-500 transition-colors" title="Instagram">
                            <Instagram className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Instagram className="w-3.5 h-3.5 opacity-20" />
                        )}
                        {lead.facebookProfile ? (
                          <a href={lead.facebookProfile} target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors" title="Facebook">
                            <Facebook className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Facebook className="w-3.5 h-3.5 opacity-20" />
                        )}
                        {lead.linkedinProfile ? (
                          <a href={lead.linkedinProfile} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors" title="LinkedIn">
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Linkedin className="w-3.5 h-3.5 opacity-20" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className={`w-4 h-4 ${lead.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                      <span className={lead.rating ? "font-semibold text-slate-900 dark:text-white" : "text-slate-400"}>
                        {lead.rating || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-slate-400 pl-5 mt-0.5">
                      {new Date(lead.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td>
                    {lead.whatsapp_sent ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-500/20">
                        <XCircle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleSendWhatsApp(lead.id)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all duration-200 border border-emerald-200/50 dark:border-emerald-500/20 hover:scale-105 active:scale-95"
                      title="Send WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && leads.length > 0 && (
        <div className="flex justify-between items-center glass rounded-2xl p-4 animate-fade-up stagger-4">
          <p className="text-xs text-slate-500 font-medium">
            Page <span className="text-slate-900 dark:text-white font-semibold">{pagination.page}</span> of <span className="text-slate-900 dark:text-white font-semibold">{pagination.totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboard;
