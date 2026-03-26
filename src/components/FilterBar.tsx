import { Search, Eye, EyeOff } from "lucide-react";
import { useMergeStore } from "../stores/mergeStore";

export function FilterBar() {
  const { searchQuery, setSearchQuery, activeFilters, toggleFilter } = useMergeStore();

  const hideIdentical = activeFilters.has("Identical");

  const handleToggleIdentical = () => {
    toggleFilter("Identical");
  };

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher par nom ou chemin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <button
        onClick={handleToggleIdentical}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          hideIdentical
            ? "bg-sky-900/30 border-sky-700 text-sky-400"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
        }`}
      >
        {hideIdentical ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {hideIdentical ? "Identiques masqués" : "Masquer identiques"}
      </button>
    </div>
  );
}
