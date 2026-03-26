import clsx from "clsx";
import {
  CheckCircle,
  ArrowRightLeft,
  FileEdit,
  Pencil,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";
import type { AnalysisStats, FileCategory } from "../types";
import { useMergeStore } from "../stores/mergeStore";

interface StatCard {
  category: FileCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
}

interface StatsCardsProps {
  stats: AnalysisStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { activeFilters, toggleFilter } = useMergeStore();

  const cards: StatCard[] = [
    {
      category: "Identical",
      label: "Identiques",
      icon: <CheckCircle className="w-4 h-4" />,
      color: "text-slate-400",
      bgColor: "bg-slate-800/50",
      borderColor: "border-slate-600",
      count: stats.identical,
    },
    {
      category: "Moved",
      label: "Déplacés",
      icon: <ArrowRightLeft className="w-4 h-4" />,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700",
      count: stats.moved,
    },
    {
      category: "Renamed",
      label: "Renommés",
      icon: <Pencil className="w-4 h-4" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-900/20",
      borderColor: "border-cyan-700",
      count: stats.renamed,
    },
    {
      category: "Modified",
      label: "Modifiés",
      icon: <FileEdit className="w-4 h-4" />,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      borderColor: "border-yellow-700",
      count: stats.modified,
    },
    {
      category: "SourceOnly",
      label: "Source seule",
      icon: <Download className="w-4 h-4" />,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700",
      count: stats.source_only,
    },
    {
      category: "DestOnly",
      label: "Dest. seule",
      icon: <Upload className="w-4 h-4" />,
      color: "text-slate-500",
      bgColor: "bg-slate-800/30",
      borderColor: "border-slate-600",
      count: stats.dest_only,
    },
    {
      category: "Conflict",
      label: "Conflits",
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
      borderColor: "border-red-700",
      count: stats.conflicts,
    },
  ];

  return (
    <div className="grid grid-cols-7 gap-2">
      {cards.map((card) => {
        const isActive = !activeFilters.has(card.category);

        return (
          <button
            key={card.category}
            onClick={() => toggleFilter(card.category)}
            className={clsx(
              "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all cursor-pointer",
              card.bgColor,
              isActive ? card.borderColor : "border-transparent opacity-40",
              "hover:opacity-100"
            )}
          >
            <div className={clsx("flex items-center gap-1.5", card.color)}>
              {card.icon}
              <span className="text-lg font-bold">{card.count}</span>
            </div>
            <span className="text-xs text-slate-400">{card.label}</span>
          </button>
        );
      })}
    </div>
  );
}
