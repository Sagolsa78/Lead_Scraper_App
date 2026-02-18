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

      // response.data exists because leadApi.js returns response.data which is the formatter object
      // The formatter object has a 'data' property which contains the result from controller
      const resultData = response.data;

      if (resultData.validLeadsCount === 0) {
        if (resultData.fallbackUsed) {
          toast(
            `No new leads found even after fallback searches for: ${resultData.fallbackKeywords.join(", ")}`,
            {
              icon: "⚠️",
            },
          );
        } else {
          toast("No new leads found matching the criteria in this area.", {
            icon: "ℹ️",
          });
        }
      } else {
        if (resultData.fallbackUsed) {
          toast(
            `Found ${resultData.validLeadsCount} leads using fallback keywords: ${resultData.fallbackKeywords.join(", ")}`,
            {
              icon: "⚠️",
            },
          );
        } else {
          toast.success(
            `Smart search complete! Found ${resultData.validLeadsCount} new leads.`,
          );
        }
      }
      fetchLeads(1);
    } catch (error) {
      // Improved error message handling
      const errorMessage =
        error.response?.data?.message || error.message || "Smart search failed";
      toast.error(errorMessage);
      console.error("Smart search error:", error);
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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Business
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Sub Category
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                City
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                Website
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
                  <td colSpan="6" className="px-6 py-4">
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
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
                      {lead.businessType}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">
                      {lead.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase">
                      {lead.subCategory || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {lead.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {lead.city}
                  </td>
                  <td className="px-6 py-4">
                    {lead.website !== "N/A" ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1 text-xs"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
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
