import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { leadService } from "../api/leadApi";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

const JobContext = createContext(null);

export const useJobs = () => {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error("useJobs must be used within JobProvider");
  return ctx;
};

const POLL_INTERVAL = 3000; // 3 seconds

export const JobProvider = ({ children }) => {
  const { user } = useAuth();

  // Active jobs map: { jobId: { status, progress, data, result, error, ... } }
  const [activeJobs, setActiveJobs] = useState({});
  // Completed jobs (most recent) for showing results
  const [completedJobs, setCompletedJobs] = useState([]);
  // Whether initial load from API is done
  const [loaded, setLoaded] = useState(false);

  const pollTimerRef = useRef(null);

  // Fetch all active/recent jobs from backend on mount
  const fetchActiveJobs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await leadService.getJobs({ status: "active" });
      const jobs = res.data?.jobs || [];
      const jobMap = {};
      jobs.forEach((job) => {
        jobMap[job.id] = job;
      });
      setActiveJobs((prev) => ({ ...prev, ...jobMap }));
    } catch (err) {
      // Silently fail — will retry on next poll
    } finally {
      setLoaded(true);
    }
  }, [user]);

  // Add a new job to tracking
  const trackJob = useCallback((jobId, jobData = {}) => {
    setActiveJobs((prev) => ({
      ...prev,
      [jobId]: {
        id: jobId,
        status: "PENDING",
        progress: 0,
        data: jobData,
        result: null,
        error: null,
      },
    }));
  }, []);

  // Poll all active jobs for status updates
  const pollJobs = useCallback(async () => {
    const jobIds = Object.keys(activeJobs).filter((id) => {
      const job = activeJobs[id];
      return job.status === "PENDING" || job.status === "RUNNING";
    });

    if (jobIds.length === 0) return;

    for (const jobId of jobIds) {
      try {
        const res = await leadService.getJobStatus(jobId);
        const job = res.data;

        setActiveJobs((prev) => ({
          ...prev,
          [jobId]: { ...prev[jobId], ...job },
        }));

        if (job.status === "COMPLETED") {
          setCompletedJobs((prev) => [job, ...prev.slice(0, 9)]); // Keep last 10
          toast.success(
            `Engine finished! ${job.result?.validLeadsCount || 0} leads extracted from ${job.data?.city || "target"}.`,
            { duration: 6000, icon: "🚀" }
          );
          // Remove from active after a delay so UI can show completion
          setTimeout(() => {
            setActiveJobs((prev) => {
              const next = { ...prev };
              delete next[jobId];
              return next;
            });
          }, 5000);
        } else if (job.status === "FAILED") {
          toast.error(
            `Engine failed: ${job.error || "Unknown error"}`,
            { duration: 6000 }
          );
          setTimeout(() => {
            setActiveJobs((prev) => {
              const next = { ...prev };
              delete next[jobId];
              return next;
            });
          }, 5000);
        }
      } catch {
        // Individual job poll failure — skip
      }
    }
  }, [activeJobs]);

  // Start polling when there are active jobs
  useEffect(() => {
    const hasActive = Object.values(activeJobs).some(
      (j) => j.status === "PENDING" || j.status === "RUNNING"
    );

    if (hasActive) {
      pollTimerRef.current = setInterval(pollJobs, POLL_INTERVAL);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [activeJobs, pollJobs]);

  // On mount (or user change), fetch active jobs from backend
  useEffect(() => {
    if (user) {
      fetchActiveJobs();
    }
  }, [user, fetchActiveJobs]);

  // Derived state
  const runningJobs = Object.values(activeJobs).filter(
    (j) => j.status === "PENDING" || j.status === "RUNNING"
  );
  const isEngineRunning = runningJobs.length > 0;

  const handleCancelJob = async (jobId) => {
    try {
      await leadService.cancelJob(jobId);
      toast.success("Engine stop signal sent.");
      setActiveJobs((prev) => {
        const next = { ...prev };
        if (next[jobId]) {
          next[jobId] = { ...next[jobId], status: "CANCELLED" };
        }
        return next;
      });
      setTimeout(() => {
        setActiveJobs((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel job");
    }
  };

  return (
    <JobContext.Provider
      value={{
        activeJobs,
        completedJobs,
        runningJobs,
        isEngineRunning,
        loaded,
        trackJob,
        fetchActiveJobs,
        cancelJob: handleCancelJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export default JobContext;
