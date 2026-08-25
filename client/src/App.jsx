import React, { useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
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
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import LeadForm from "./components/LeadForm";
import ResultSummary from "./components/ResultSummary";
import LeadsDashboard from "./pages/LeadsDashboard";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { leadService } from "./api/leadApi";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerateLeads = async (data) => {
    setIsLoading(true);
    setResults(null);
    try {
      const response = await leadService.generateLeads(data);
      const jobId = response.data.jobId;
      toast.success("Lead generation job started!");
      
      // Poll job status
      const interval = setInterval(async () => {
        try {
          const jobResponse = await leadService.getJobStatus(jobId);
          const job = jobResponse.data;
          
          if (job.status === "COMPLETED") {
            clearInterval(interval);
            setIsLoading(false);
            setResults(job.result);
            
            if (job.result.validLeadsCount === 0) {
              toast("No leads found matching your criteria.", { icon: "ℹ️" });
            } else {
              toast.success(`Success! Generated ${job.result.validLeadsCount} new leads.`);
            }
          } else if (job.status === "FAILED") {
            clearInterval(interval);
            setIsLoading(false);
            toast.error(job.error || "Job failed to complete.");
          }
        } catch (pollError) {
          clearInterval(interval);
          setIsLoading(false);
          toast.error("Failed to track job status.");
        }
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      const message =
        error.response?.data?.message || "Failed to start lead generation.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Find High-Intent Business Leads <br />
          <span className="text-primary-600">Without Websites.</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Extract real-time data from Google Places. Filter for businesses
          missing websites. Automatically sync to PostgreSQL and Sheets.
        </p>
        <div className="flex flex-wrap justify-center gap-8 pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-primary-500" /> Enterprise
            Security
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Zap className="w-4 h-4 text-amber-500" /> Real-time Sync
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Globe className="w-4 h-4 text-blue-500" /> India-focused
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-3xl p-8 shadow-xl shadow-primary-500/5 mb-12 border border-white/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-600" /> Lead Generator
          </h3>
          <LeadForm onSubmit={handleGenerateLeads} isLoading={isLoading} />
        </div>
        <ResultSummary results={results} />
      </div>
    </div>
  );
};

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { title: "Generator", icon: <Database className="w-5 h-5" />, path: "/" },
    {
      title: "CRM Leads",
      icon: <Users className="w-5 h-5" />,
      path: "/dashboard/leads",
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/dashboard/analytics",
    },
    {
      title: "Settings",
      icon: <SettingsIcon className="w-5 h-5" />,
      path: "/dashboard/settings",
    },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-right" />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/20">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              LeadFinder
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={closeSidebar}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                  ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/10 text-primary-600 ring-1 ring-primary-500/10"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                `}
              >
                {item.icon}
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {user && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 truncate">
                {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </aside>

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 glass border-b border-slate-200 dark:border-slate-800 px-6 py-4 lg:hidden">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-primary-600">LeadFinder</span>
            <div className="w-6" />
          </div>
        </header>

        <main className="flex-grow p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard/leads" element={<LeadsDashboard />} />
              <Route
                path="/dashboard/settings"
                element={<WhatsAppSettings />}
              />
              <Route path="/dashboard/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} LeadFinder — B2B Lead Discovery
            Platform
          </div>
        </footer>
      </div>
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
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
