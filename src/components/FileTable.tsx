import { useRef, useMemo, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import {
  CheckCircle,
  ArrowRightLeft,
  Pencil,
  FileEdit,
  Download,
  Upload,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { useMergeStore } from "../stores/mergeStore";
import { ConflictResolver } from "./ConflictResolver";
import { formatSize, formatDate, actionLabel, categoryLabel } from "../utils/format";
import type { AnalyzedFile, FileCategory, MergeAction } from "../types";

const CATEGORY_ICONS: Record<FileCategory, React.ReactNode> = {
  Identical: <CheckCircle className="w-3.5 h-3.5 text-slate-400" />,
  Moved: <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />,
  Renamed: <Pencil className="w-3.5 h-3.5 text-cyan-400" />,
  Modified: <FileEdit className="w-3.5 h-3.5 text-yellow-400" />,
  SourceOnly: <Download className="w-3.5 h-3.5 text-green-400" />,
  DestOnly: <Upload className="w-3.5 h-3.5 text-slate-500" />,
  Conflict: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
};

const CATEGORY_BADGE_STYLES: Record<FileCategory, string> = {
  Identical: "bg-slate-800 text-slate-400 border-slate-700",
  Moved: "bg-blue-900/30 text-blue-400 border-blue-800",
  Renamed: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
  Modified: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  SourceOnly: "bg-green-900/30 text-green-400 border-green-800",
  DestOnly: "bg-slate-800/50 text-slate-500 border-slate-700",
  Conflict: "bg-red-900/30 text-red-400 border-red-800",
};

const ACTION_STYLES: Record<string, string> = {
  Skip: "text-slate-500",
  CopyToDestination: "text-green-400",
  KeepBoth: "text-yellow-400",
  KeepSource: "text-orange-400",
  KeepDest: "text-sky-400",
};

function getActionStyle(action: MergeAction): string {
  if (typeof action === "string") return ACTION_STYLES[action] ?? "text-slate-400";
  if ("KeepBoth" in action) return ACTION_STYLES.KeepBoth;
  return "text-slate-400";
}

const ROW_HEIGHT = 64;

export function FileTable() {
  const { analysisResult, activeFilters, searchQuery, updateFileAction, conflictSuffix } =
    useMergeStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const [conflictFile, setConflictFile] = useState<{
    file: AnalyzedFile;
    index: number;
  } | null>(null);

  const filteredFiles = useMemo(() => {
    if (!analysisResult) return [];

    return analysisResult.files
      .map((file, index) => ({ file, originalIndex: index }))
      .filter(({ file }) => {
        // activeFilters = catégories à MASQUER
        if (activeFilters.has(file.category)) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const sourcePath = file.source_entry?.relative_path.toLowerCase() ?? "";
          const destPath = file.dest_entry?.relative_path.toLowerCase() ?? "";
          const fileName =
            file.source_entry?.file_name.toLowerCase() ??
            file.dest_entry?.file_name.toLowerCase() ??
            "";
          return (
            sourcePath.includes(query) ||
            destPath.includes(query) ||
            fileName.includes(query)
          );
        }
        return true;
      });
  }, [analysisResult, activeFilters, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const handleResolve = useCallback(
    (index: number, action: MergeAction) => {
      updateFileAction(index, action);
      setConflictFile(null);
    },
    [updateFileAction]
  );

  const handleApplyToAll = useCallback(
    (action: MergeAction) => {
      if (!analysisResult) return;
      analysisResult.files.forEach((f, i) => {
        if (f.category === "Conflict" || f.category === "Modified") {
          updateFileAction(i, action);
        }
      });
      setConflictFile(null);
    },
    [analysisResult, updateFileAction]
  );

  if (!analysisResult) return null;

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-[110px_1fr_1fr_140px] gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase border-b border-slate-700">
        <span>Statut</span>
        <span>Source (ancien)</span>
        <span>Destination (OneDrive)</span>
        <span className="text-center">Action</span>
      </div>

      {/* Liste virtualisée */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const { file, originalIndex } = filteredFiles[virtualRow.index];
            const src = file.source_entry;
            const dest = file.dest_entry;
            const cat = categoryLabel(file.category);
            const isConflict = file.category === "Conflict" || file.category === "Modified";

            return (
              <div
                key={virtualRow.index}
                className="absolute top-0 left-0 w-full grid grid-cols-[110px_1fr_1fr_140px] gap-2 items-center px-4 hover:bg-slate-800/40 border-b border-slate-800/30"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Badge statut */}
                <div>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                      CATEGORY_BADGE_STYLES[file.category]
                    )}
                  >
                    {CATEGORY_ICONS[file.category]}
                    {cat.label}
                  </span>
                </div>

                {/* Colonne Source */}
                <div className="min-w-0 pr-2">
                  {src ? (
                    <div>
                      <p className="text-sm text-slate-300 truncate" title={src.relative_path}>
                        {src.relative_path}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatSize(src.size)} — {formatDate(src.modified_at)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">—</span>
                  )}
                </div>

                {/* Colonne Destination */}
                <div className="min-w-0 pr-2">
                  {dest ? (
                    <div>
                      <p className="text-sm text-slate-300 truncate" title={dest.relative_path}>
                        {dest.relative_path}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatSize(dest.size)} — {formatDate(dest.modified_at)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">—</span>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center justify-center">
                  {isConflict ? (
                    <button
                      onClick={() => setConflictFile({ file, index: originalIndex })}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 border border-yellow-700/50"
                    >
                      <Settings2 className="w-3 h-3" />
                      {actionLabel(file.selected_action)}
                    </button>
                  ) : (
                    <span className={clsx("text-[11px] font-medium", getActionStyle(file.selected_action))}>
                      {actionLabel(file.selected_action)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compteur */}
      <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
        {filteredFiles.length} fichier{filteredFiles.length > 1 ? "s" : ""}{" "}
        affiché{filteredFiles.length > 1 ? "s" : ""} sur{" "}
        {analysisResult.files.length}
      </div>

      {/* Modal conflit */}
      {conflictFile && (
        <ConflictResolver
          file={conflictFile.file}
          index={conflictFile.index}
          onResolve={handleResolve}
          onApplyToAll={handleApplyToAll}
          onClose={() => setConflictFile(null)}
          conflictSuffix={conflictSuffix}
        />
      )}
    </>
  );
}
