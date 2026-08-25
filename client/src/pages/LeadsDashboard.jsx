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
} from "lucide-react";
import { leadService } from "../api/leadApi";
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

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      order: prev.sortBy === field && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ field }) => {
    if (filters.sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-primary-500 ml-1">{filters.order === "desc" ? "↓" : "↑"}</span>;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" /> CRM Leads
          </h2>
          <p className="text-slate-500 text-sm">
            Manage and contact your business leads
          </p>
        </div>
      </div>

      {/* Smart Search Section */}
      <div className="glass rounded-2xl p-6 border-primary-500/20 bg-primary-50/10 dark:bg-primary-900/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" /> Smart Lead Search
        </h3>
        <form
          onSubmit={handleSmartSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            type="text"
            placeholder="City (e.g. Lucknow)"
            required
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={smartSearch.city}
            onChange={(e) =>
              setSmartSearch({ ...smartSearch, city: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Business Type (e.g. restaurant)"
            required
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={smartSearch.businessType}
            onChange={(e) =>
              setSmartSearch({ ...smartSearch, businessType: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Limit (Max 500)"
            max="500"
            min="1"
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
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
            className="bg-primary-600 text-white rounded-xl py-2 px-4 text-sm font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Start Smart Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search business or phone..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by city..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Filter by sub category..."
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={filters.subCategory}
            onChange={(e) =>
              setFilters({ ...filters, subCategory: e.target.value })
            }
          />
        </div>
        <div>
          <select
            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            value={filters.whatsapp_status}
            onChange={(e) =>
              setFilters({ ...filters, whatsapp_status: e.target.value })
            }
          >
            <option value="">All WhatsApp Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button
          onClick={() => fetchLeads(1)}
          className="bg-primary-600 text-white rounded-xl py-2 px-4 text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" /> Apply Filters
        </button>
      </div>

      {/* Leads Table */}
      <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("name")}>
                Business <SortIcon field="name" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("priority")}>
                Priority <SortIcon field="priority" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("status")}>
                Status <SortIcon field="status" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Phone / Valid
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("socialScore")}>
                Social / Web <SortIcon field="socialScore" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("rating")}>
                Rating <SortIcon field="rating" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort("createdAt")}>
                Created <SortIcon field="createdAt" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                WhatsApp
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="9" className="px-6 py-4">
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No leads found matching current filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white uppercase text-sm truncate max-w-[200px]">
                      {lead.name}
                    </div>
                    <div className="text-[10px] text-primary-500 font-bold uppercase tracking-wider">
                      {lead.businessType} • {lead.subCategory || "General"}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {lead.city}
                    </div>
                    {lead.googleMapsUrl && (
                      <a
                        href={lead.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                      >
                        View on Maps <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium uppercase tracking-wider
                        ${
                          lead.status === "converted"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : lead.status === "contacted"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : lead.status === "qualified"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                        }
                     `}
                    >
                      {lead.status || "New"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                        {lead.phone}
                      </span>
                      <div className="flex items-center gap-2">
                        {lead.phoneValid ? (
                          <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Unverified
                          </span>
                        )}
                        {lead.whatsappEnabled && (
                          <span className="text-[10px] flex items-center gap-0.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3" /> WA
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {/* Social Score Badge */}
                      {(() => {
                        const statusColors = {
                          STRONG:
                            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          ACTIVE:
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          WEAK: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                          NONE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                        };
                        const status = lead.socialStatus || "NONE";
                        const score = lead.socialScore || 0;
                        const colorClass =
                          statusColors[status] || statusColors["NONE"];

                        return (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
                            >
                              {status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {score}/80
                            </span>
                          </div>
                        );
                      })()}

                      {/* Social Icons */}
                      <div className="flex items-center gap-2 text-slate-400">
                        {lead.website !== "N/A" && lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary-500 transition-colors"
                            title="Website"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        ) : (
                          <Globe className="w-4 h-4 opacity-30" />
                        )}
                        {lead.instagramProfile ? (
                          <a
                            href={lead.instagramProfile}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-pink-600 transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        ) : (
                          <Instagram className="w-4 h-4 opacity-30" />
                        )}
                        {lead.facebookProfile ? (
                          <a
                            href={lead.facebookProfile}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-blue-600 transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        ) : (
                          <Facebook className="w-4 h-4 opacity-30" />
                        )}
                        {lead.linkedinProfile ? (
                          <a
                            href={lead.linkedinProfile}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-blue-700 transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        ) : (
                          <Linkedin className="w-4 h-4 opacity-30" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star
                        className={`w-4 h-4 ${lead.rating ? "fill-amber-500" : "text-slate-300"}`}
                      />
                      <span
                        className={
                          lead.rating
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400"
                        }
                      >
                        {lead.rating || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-slate-400 pl-5">
                      {new Date(lead.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.whatsapp_sent ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20">
                        <XCircle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSendWhatsApp(lead.id)}
                      className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
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
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
