import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, MapPin, Target, Loader2, Sparkles, ArrowRight, Zap } from "lucide-react";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";

const schema = z.object({
  city: z.string().min(1, "City is required"),
  keyword: z.string().optional(),
  radius: z.number().min(100).max(50000).default(3000),
  limit: z.number().min(1).max(60).default(20),
});

const FormField = ({ label, icon: Icon, error, children, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="space-y-2 relative"
  >
    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-widest pl-1">
      <Icon className="w-4 h-4 text-primary-500" />
      {label}
    </label>
    <div className="relative group">
      {children}
      {/* Input Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-primary-500/0 rounded-2xl blur-md transition-colors duration-300 group-focus-within:bg-primary-500/10"></div>
    </div>
    {error && (
      <motion.p 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 pl-1"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        {error.message}
      </motion.p>
    )}
  </motion.div>
);

const LeadForm = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      radius: 3000,
      limit: 20,
      keyword: "",
      city: "",
    },
  });

  const presets = [
    { city: "Bangalore", keyword: "Software Companies" },
    { city: "Mumbai", keyword: "Restaurants & Cafes" },
    { city: "Delhi", keyword: "Digital Marketing Agencies" },
    { city: "Lucknow", keyword: "Real Estate Consultants" },
  ];

  const applyPreset = (preset) => {
    setValue("city", preset.city, { shouldValidate: true });
    setValue("keyword", preset.keyword, { shouldValidate: true });
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 md:p-10 glow-primary border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
      {/* Card Glow Ambient Pill */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary-500/10 to-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-600 shadow-xl shadow-primary-500/25 text-white">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Target Search Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Configure geographic radius, business categories, and extraction limits
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-8 space-y-2">
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
          Quick Preset Suggestions
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-500/15 hover:text-primary-700 dark:hover:text-primary-400 border border-slate-200 dark:border-white/[0.08] transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-slate-800 dark:text-slate-200">{p.keyword}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">in {p.city}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Target City" icon={MapPin} error={errors.city} delay={0.1}>
            <input
              {...register("city")}
              placeholder="e.g. Lucknow, India"
              className={cn(
                "input-field",
                errors.city && "!border-red-400 !ring-red-500/20 focus:!border-red-400"
              )}
            />
          </FormField>

          <FormField label="Industry / Keyword" icon={Search} error={errors.keyword} delay={0.2}>
            <input
              {...register("keyword")}
              placeholder="e.g. software companies, cafes, clinics"
              className={cn(
                "input-field",
                errors.keyword && "!border-red-400 !ring-red-500/20 focus:!border-red-400"
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Radius (Meters)" icon={Target} error={errors.radius} delay={0.3}>
            <input
              type="number"
              {...register("radius", { valueAsNumber: true })}
              className="input-field"
            />
          </FormField>

          <FormField label="Max Leads to Extract" icon={Sparkles} error={errors.limit} delay={0.4}>
            <input
              type="number"
              {...register("limit", { valueAsNumber: true })}
              className="input-field"
            />
          </FormField>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-4 text-base font-black flex items-center gap-3 justify-center group relative overflow-hidden shadow-2xl shadow-primary-500/30"
          >
            {/* Animated Shimmer Line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            
            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scraping Google Places Engine...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>Execute Extraction Engine</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
                </>
              )}
            </span>
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default LeadForm;
