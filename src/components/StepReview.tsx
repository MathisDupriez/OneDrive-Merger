import { useMergeStore } from "../stores/mergeStore";
import { StatsCards } from "./StatsCards";
import { FilterBar } from "./FilterBar";
import { FileTable } from "./FileTable";
import clsx from "clsx";

export function StepReview() {
  const { analysisResult, setStep } = useMergeStore();

  if (!analysisResult) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 gap-4">
      {/* Stats */}
      <StatsCards stats={analysisResult.stats} />

      {/* Filtres */}
      <FilterBar />

      {/* Table virtualisée */}
      <div className="flex-1 flex flex-col bg-[#16213e] rounded-lg border border-slate-700 overflow-hidden min-h-0">
        <FileTable />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Retour
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(4)}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-sm transition-all",
              "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            )}
          >
            Lancer le merge
          </button>
        </div>
      </div>
    </div>
  );
}
