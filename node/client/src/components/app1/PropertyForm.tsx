"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PropertyFeatures } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

const schema = z.object({
  square_footage: z
    .number({ invalid_type_error: "Enter a valid number" })
    .positive("Must be greater than 0"),
  bedrooms: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative"),
  bathrooms: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative"),
  year_built: z
    .number({ invalid_type_error: "Enter a valid year" })
    .min(1700, "Must be 1700 or later")
    .max(CURRENT_YEAR, `Cannot exceed ${CURRENT_YEAR}`),
  lot_size: z
    .number({ invalid_type_error: "Enter a valid number" })
    .positive("Must be greater than 0"),
  distance_to_city_center: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Cannot be negative"),
  school_rating: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Must be 0–10")
    .max(10, "Must be 0–10"),
});

type FormValues = z.infer<typeof schema>;

const FIELDS: Array<{
  name: keyof FormValues;
  label: string;
  placeholder: string;
  step?: string;
  unit?: string;
}> = [
  {
    name: "square_footage",
    label: "Square Footage",
    placeholder: "1550",
    unit: "sq ft",
  },
  { name: "bedrooms", label: "Bedrooms", placeholder: "3", step: "1" },
  { name: "bathrooms", label: "Bathrooms", placeholder: "2", step: "0.5" },
  { name: "year_built", label: "Year Built", placeholder: "1997", step: "1" },
  { name: "lot_size", label: "Lot Size", placeholder: "6800", unit: "sq ft" },
  {
    name: "distance_to_city_center",
    label: "Distance to City Center",
    placeholder: "4.1",
    unit: "miles",
  },
  {
    name: "school_rating",
    label: "School Rating",
    placeholder: "7.6",
    step: "0.1",
    unit: "/ 10",
  },
];

interface Props {
  onSubmit: (features: PropertyFeatures) => void;
  isLoading: boolean;
}

export function PropertyForm({ onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      noValidate
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Property Details
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {field.label}
              {field.unit && (
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({field.unit})
                </span>
              )}
            </label>
            <input
              id={field.name}
              {...register(field.name, { valueAsNumber: true })}
              type="number"
              step={field.step ?? "any"}
              placeholder={field.placeholder}
              aria-invalid={!!errors[field.name]}
              aria-describedby={
                errors[field.name] ? `${field.name}-error` : undefined
              }
              className={[
                "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
                "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors[field.name]
                  ? "border-red-400 bg-red-50 focus:ring-red-400"
                  : "border-slate-300 bg-white hover:border-slate-400",
              ].join(" ")}
            />
            {errors[field.name] && (
              <p
                id={`${field.name}-error`}
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Estimating…
          </>
        ) : (
          "Estimate Property Value"
        )}
      </button>
    </form>
  );
}
