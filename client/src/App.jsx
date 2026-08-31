import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  ShieldCheck,
  Zap,
  Database,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Menu,
  LogOut,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Target,
  TrendingUp,
  Activity,
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import LeadForm from "./components/LeadForm";
import ResultSummary from "./components/ResultSummary";
import LeadsDashboard from "./pages/LeadsDashboard";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Docs from "./pages/Docs";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { JobProvider, useJobs } from "./context/JobContext";
import { leadService } from "./api/leadApi";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-primary-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">Loading LeadFinder...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const FeaturePill = ({ icon: Icon, label, color }) => (
  <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-md">
    <Icon className={`w-3.5 h-3.5 ${color} transition-transform duration-300 group-hover:scale-110`} />
    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
  </div>
);

// Active Engine Status Bar — shown globally when any job is running
const ActiveEngineBar = () => {
  const { runningJobs, isEngineRunning, cancelJob } = useJobs();

  if (!isEngineRunning) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-gradient-to-r from-primary-600 via-violet-600 to-pink-600 text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <Activity className="w-3 h-3 absolute inset-0 m-auto text-white/80" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest">
              Engine Active — {runningJobs.length} job{runningJobs.length > 1 ? "s" : ""} running
            </span>
            <span className="text-[10px] font-medium text-white/70">
              {runningJobs.map((j) => `${j.data?.keyword || "All"} in ${j.data?.city || "—"}`).join(" • ")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runningJobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full pl-3 pr-1 py-1">
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${j.progress || 5}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[10px] font-bold">{j.progress || 0}%</span>
              <button 
                onClick={() => cancelJob(j.id)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors ml-1"
                title="Stop Engine"
              >
                <X className="w-3 h-3 text-white/80" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Home = ({ onSearchComplete }) => {
  const { runningJobs, isEngineRunning, completedJobs, trackJob } = useJobs();

  // Show results from the most recent completed job
  const latestCompleted = completedJobs[0] || null;
  const results = latestCompleted?.result || null;

  const handleGenerateLeads = async (data) => {
    try {
      const response = await leadService.generateLeads(data);
      const jobId = response.data.jobId;
      trackJob(jobId, data);
      toast.success("Lead generation engine started! You can navigate freely — progress is tracked globally.");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to start lead generation.";
      toast.error(message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Hero Header */}
      <div className="text-center space-y-6 pt-4 pb-4 relative">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 border border-primary-500/20 mb-2 backdrop-blur-md shadow-lg shadow-primary-500/5"
        >
          <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
          <span className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Autonomous B2B Lead Extraction</span>
        </motion.div>

        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl md:text-6xl lg:text-[4.25rem] font-black tracking-tight leading-[1.08]"
        >
          <span className="text-slate-900 dark:text-white">Uncover High-Intent</span>
          <br />
          <span className="gradient-text">B2B Business Leads.</span>
        </motion.h2>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Harness real-time geospatial intelligence, WhatsApp eligibility scoring, and social audit verification to fuel your sales engine.
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 pt-2"
        >
          <FeaturePill icon={ShieldCheck} label="99.4% Valid Phones" color="text-emerald-500" />
          <FeaturePill icon={Zap} label="Direct WhatsApp Export" color="text-amber-500" />
          <FeaturePill icon={Globe} label="Google Places API" color="text-primary-500" />
        </motion.div>
      </div>

      {/* Running Jobs Status Cards */}
      <AnimatePresence>
        {isEngineRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto space-y-3"
          >
            {runningJobs.map((job) => (
              <div
                key={job.id}
                className="glass-card rounded-2xl p-5 border border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/[0.03] shadow-lg shadow-primary-500/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
                      <Zap className="w-3.5 h-3.5 absolute inset-0 m-auto text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        Engine Scraping: <span className="text-primary-500">{job.data?.keyword || "All"}</span> in <span className="text-primary-500">{job.data?.city || "—"}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Job ID: {job.id?.slice(0, 8)}... • Status: {job.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-primary-600 dark:text-primary-400">{job.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress || 2}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Generator Form Card */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <LeadForm onSubmit={handleGenerateLeads} isLoading={isEngineRunning} />

        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="mt-8"
            >
              <ResultSummary results={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = [
    {
      group: "DISCOVERY & REVENUE",
      items: [
        { title: "Lead Finder", icon: <Database className="w-[18px] h-[18px]" />, path: "/", badge: "AI" },
        { title: "CRM Leads", icon: <Users className="w-[18px] h-[18px]" />, path: "/dashboard/leads", badge: null },
      ]
    },
    {
      group: "INTELLIGENCE",
      items: [
        { title: "Analytics", icon: <BarChart3 className="w-[18px] h-[18px]" />, path: "/dashboard/analytics", badge: "Pro" },
        { title: "WhatsApp & API", icon: <SettingsIcon className="w-[18px] h-[18px]" />, path: "/dashboard/settings", badge: null },
      ]
    }
  ];

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case "/": return "Lead Discovery Engine";
      case "/dashboard/leads": return "CRM Leads Database";
      case "/dashboard/analytics": return "Performance Analytics";
      case "/dashboard/settings": return "WhatsApp & Integration Settings";
      default: return "Dashboard";
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const openSidebar = () => setIsSidebarOpen(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 transition-colors duration-500 font-sans selection:bg-primary-500/30 selection:text-white relative overflow-hidden flex flex-col">
      {/* Ambient Background Mesh */}
      <div className="mesh-bg" />

      {/* Global Engine Status Bar */}
      <ActiveEngineBar />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '18px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#0f172a',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
            padding: '16px 20px',
          },
          className: 'dark:!bg-surface-900/90 dark:!text-white dark:!border-white/10 dark:!shadow-2xl dark:!shadow-black/60',
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-surface-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Brand + Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 font-bold text-xs"
              title="Toggle Sidebar Menu"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Sidebar</span>
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer ml-1" onClick={() => navigate("/")}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-primary-600 to-pink-600 p-2 rounded-xl text-white shadow-md">
                  <Search className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl font-black gradient-text tracking-tight hidden xs:inline">LeadFinder</span>
            </div>
          </div>

          {/* Center Route Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            {navGroups[0].items.concat(navGroups[1].items).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-white dark:bg-white/15 text-primary-600 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Session Encrypted</span>
            </div>
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25 dark:bg-black/50 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sliding Collapsible Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[290px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col glass rounded-r-[2.5rem] border-l-0 overflow-hidden shadow-2xl bg-white dark:bg-surface-900">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-pink-600 p-2.5 rounded-2xl text-white shadow-md">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black gradient-text tracking-tight block">LeadFinder</span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Navigation Drawer</span>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <div className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.group}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        isActive ? "sidebar-link-active" : "sidebar-link"
                      }
                    >
                      {item.icon}
                      <span className="font-bold text-sm">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Live System Status Widget */}
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Places API</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">100% Operational • PostgreSQL Connected</p>
          </div>

          {/* User Profile Footer */}
          <div className="p-5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-black/30">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white text-sm font-black shadow-md">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Sign out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  closeSidebar();
                  navigate("/login");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Sign In to Dashboard
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home onSearchComplete={openSidebar} />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><LeadsDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><WhatsAppSettings /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/[0.08] py-8 bg-white dark:bg-surface-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500 font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>© {new Date().getFullYear()} <strong className="text-slate-800 dark:text-slate-200">LeadFinder Inc.</strong> — Autonomous Geospatial Lead Extraction.</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-extrabold uppercase tracking-widest text-slate-500">
            <Link to="/docs" className="hover:text-primary-500 transition-colors">API Docs</Link>
            <Link to="/docs" className="hover:text-primary-500 transition-colors">PostgreSQL Sync</Link>
            <Link to="/docs" className="hover:text-primary-500 transition-colors">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <JobProvider>
              <AppLayout />
            </JobProvider>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
