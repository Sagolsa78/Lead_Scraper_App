import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, MapPin, Target, Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

const schema = z.object({
  city: z.string().min(1, "City is required"),
  keyword: z.string().optional(),
  radius: z.number().min(100).max(50000).default(3000),
  limit: z.number().min(1).max(60).default(20),
});

const LeadForm = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      radius: 3000,
      limit: 20,
      keyword: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> City
          </label>
          <input
            {...register("city")}
            placeholder="e.g. Lucknow"
            className={cn(
              "w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all",
              errors.city
                ? "border-red-500"
                : "border-slate-200 dark:border-slate-800",
            )}
          />
          {errors.city && (
            <p className="text-xs text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Search className="w-4 h-4" /> Keyword (Optional)
          </label>
          <input
            {...register("keyword")}
            placeholder="e.g. restaurants"
            className={cn(
              "w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all",
              errors.keyword
                ? "border-red-500"
                : "border-slate-200 dark:border-slate-800",
            )}
          />
          {errors.keyword && (
            <p className="text-xs text-red-500">{errors.keyword.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4" /> Radius (meters)
          </label>
          <input
            type="number"
            {...register("radius", { valueAsNumber: true })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Max Leads
          </label>
          <input
            type="number"
            {...register("limit", { valueAsNumber: true })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn btn-primary py-3 text-lg flex items-center gap-2 justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Generating Leads...
          </>
        ) : (
          <>Generate Leads</>
        )}
      </button>
    </form>
  );
};

export default LeadForm;
