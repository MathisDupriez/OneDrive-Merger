import clsx from "clsx";
import { Check } from "lucide-react";
import { useMergeStore } from "../stores/mergeStore";

const STEPS = [
  { number: 1, label: "Sélection" },
  { number: 2, label: "Analyse" },
  { number: 3, label: "Revue" },
  { number: 4, label: "Fusion" },
] as const;

export function Stepper() {
  const currentStep = useMergeStore((s) => s.currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-4 px-8">
      {STEPS.map((step, i) => {
        const isActive = step.number === currentStep;
        const isPast = step.number < currentStep;
        const isFuture = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2">
            {/* Cercle numéroté */}
            <div
              className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                isActive && "bg-sky-500 text-white",
                isPast && "bg-green-500 text-white",
                isFuture && "bg-slate-700 text-slate-400"
              )}
            >
              {isPast ? <Check className="w-4 h-4" /> : step.number}
            </div>

            {/* Label */}
            <span
              className={clsx(
                "text-sm font-medium transition-colors",
                isActive && "text-sky-400",
                isPast && "text-green-400",
                isFuture && "text-slate-500"
              )}
            >
              {step.label}
            </span>

            {/* Ligne de connexion */}
            {i < STEPS.length - 1 && (
              <div
                className={clsx(
                  "w-16 h-0.5 mx-2",
                  step.number < currentStep ? "bg-green-500" : "bg-slate-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
