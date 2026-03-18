"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PropertyFeatures, WhatIfResult } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

const schema = z.object({
  square_footage: z.number().positive("Must be greater than 0"),
  bedrooms: z.number().min(0, "Cannot be negative"),
  bathrooms: z.number().min(0, "Cannot be negative"),
  year_built: z
    .number()
    .min(1700, "Must be 1700 or later")
    .max(CURRENT_YEAR, `Cannot exceed ${CURRENT_YEAR}`),
  lot_size: z.number().positive("Must be greater than 0"),
  distance_to_city_center: z.number().min(0, "Cannot be negative"),
  school_rating: z.number().min(0, "Must be 0-10").max(10, "Must be 0-10"),
});

type FormValues = z.infer<typeof schema>;

const FIELDS: Array<{
  name: keyof FormValues;
  label: string;
  step?: string;
  placeholder: string;
}> = [
  { name: "square_footage", label: "Square Footage", placeholder: "1800" },
  { name: "bedrooms", label: "Bedrooms", step: "1", placeholder: "3" },
  { name: "bathrooms", label: "Bathrooms", step: "0.5", placeholder: "2" },
  { name: "year_built", label: "Year Built", step: "1", placeholder: "2002" },
  { name: "lot_size", label: "Lot Size", placeholder: "7600" },
  {
    name: "distance_to_city_center",
    label: "Distance to City Center",
    placeholder: "5.2",
  },
  {
    name: "school_rating",
    label: "School Rating",
    step: "0.1",
    placeholder: "8.0",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  isLoading: boolean;
  result: WhatIfResult | null;
  error: string | null;
  onSubmit: (features: PropertyFeatures) => void;
}

export function WhatIfPanel({ isLoading, result, error, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      square_footage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      year_built: 2002,
      lot_size: 7600,
      distance_to_city_center: 5.2,
      school_rating: 8,
    },
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        What-if Analysis
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Simulate a property profile and compare the prediction against current
        market average.
      </p>

      <form
        onSubmit={handleSubmit((data) => onSubmit(data))}
        noValidate
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              className="mb-1 block text-xs font-medium text-slate-600"
              htmlFor={field.name}
            >
              {field.label}
            </label>
            <input
              id={field.name}
              type="number"
              step={field.step ?? "any"}
              placeholder={field.placeholder}
              {...register(field.name, { valueAsNumber: true })}
              className={[
                "w-full rounded-lg border px-3 py-2 text-sm",
                errors[field.name]
                  ? "border-red-300 bg-red-50"
                  : "border-slate-300 bg-white hover:border-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              ].join(" ")}
            />
            {errors[field.name] && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}

        <div className="sm:col-span-2 mt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? "Running analysis..." : "Run What-if"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Predicted Value
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(result.prediction)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Vs Market Average
            </p>
            <p
              className={[
                "mt-1 text-xl font-bold",
                result.varianceFromAverage >= 0
                  ? "text-emerald-600"
                  : "text-red-600",
              ].join(" ")}
            >
              {result.varianceFromAverage >= 0 ? "+" : ""}
              {result.varianceFromAverage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
