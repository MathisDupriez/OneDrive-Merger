import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Zap, RotateCcw, Download, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useMergeStore } from "../stores/mergeStore";
import { useMerge } from "../hooks/useMerge";
import { ProgressBar } from "./ProgressBar";
import { formatDuration } from "../utils/format";

export function StepMerge() {
  const {
    analysisResult,
    mergeProgress,
    mergeReport,
    isMerging,
    mergeLogs,
    setStep,
    reset,
  } = useMergeStore();

  const { startMerge } = useMerge();
  const [phase, setPhase] = useState<"preview" | "running" | "done">("preview");
  const logRef = useRef<HTMLDivElement>(null);

  // Scroll auto sur les logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [mergeLogs]);

  // Détecter la fin du merge
  useEffect(() => {
    if (mergeReport && !isMerging) {
      setPhase("done");
    }
  }, [mergeReport, isMerging]);

  const handleExecute = useCallback(async () => {
    setPhase("running");
    await startMerge(false);
  }, [startMerge]);

  const handleExportReport = useCallback(async () => {
    if (!mergeReport) return;
    const path = await save({
      filters: [{ name: "JSON", extensions: ["json"] }],
      defaultPath: "rapport-merge.json",
    });
    if (path) {
      await invoke("export_report", { report: mergeReport, outputPath: path });
    }
  }, [mergeReport]);

  if (!analysisResult) return null;

  // Compter les opérations prévues
  const toCopy = analysisResult.files.filter(
    (f) => f.selected_action === "CopyToDestination"
  ).length;
  const toKeepBoth = analysisResult.files.filter(
    (f) => typeof f.selected_action === "object" && "KeepBoth" in f.selected_action
  ).length;
  const toSkip = analysisResult.files.filter(
    (f) => f.selected_action === "Skip" || f.selected_action === "KeepDest"
  ).length;
  const toOverwrite = analysisResult.files.filter(
    (f) => f.selected_action === "KeepSource"
  ).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-8 gap-6">
      {/* Phase Preview */}
      {phase === "preview" && (
        <>
          <h2 className="text-2xl font-bold text-slate-200 text-center">
            Confirmation du merge
          </h2>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-800 text-center">
              <p className="text-2xl font-bold text-green-400">{toCopy}</p>
              <p className="text-xs text-green-500 mt-1">Fichiers à copier</p>
            </div>
            <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-800 text-center">
              <p className="text-2xl font-bold text-yellow-400">{toKeepBoth}</p>
              <p className="text-xs text-yellow-500 mt-1">Garder les deux</p>
            </div>
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-800 text-center">
              <p className="text-2xl font-bold text-red-400">{toOverwrite}</p>
              <p className="text-xs text-red-500 mt-1">Écraser destination</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
              <p className="text-2xl font-bold text-slate-400">{toSkip}</p>
              <p className="text-xs text-slate-500 mt-1">Ignorés</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Retour à la revue
            </button>
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Zap className="w-5 h-5" />
              Exécuter le merge
            </button>
          </div>
        </>
      )}

      {/* Phase Running */}
      {phase === "running" && (
        <>
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-200">
              Merge en cours...
            </h2>
          </div>

          {mergeProgress && (
            <div className="max-w-2xl mx-auto w-full">
              <ProgressBar
                value={mergeProgress.completed_operations}
                max={mergeProgress.total_operations}
                label={mergeProgress.current_operation}
                color="green"
              />
            </div>
          )}

          {/* Logs en temps réel */}
          <div
            ref={logRef}
            className="flex-1 bg-slate-900 rounded-lg border border-slate-700 p-4 overflow-auto font-mono text-xs min-h-0"
          >
            {mergeLogs.map((log, i) => (
              <div
                key={i}
                className={clsx(
                  "py-0.5",
                  log.level === "error" && "text-red-400",
                  log.level === "warning" && "text-yellow-400",
                  log.level === "info" && "text-slate-400"
                )}
              >
                {log.message}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Phase Done */}
      {phase === "done" && mergeReport && (
        <>
          <h2 className="text-2xl font-bold text-green-400 text-center">
            Merge terminé
          </h2>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-800 text-center">
              <p className="text-2xl font-bold text-green-400">
                {mergeReport.successful}
              </p>
              <p className="text-xs text-green-500 mt-1">Réussites</p>
            </div>
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-800 text-center">
              <p className="text-2xl font-bold text-red-400">
                {mergeReport.errors.length}
              </p>
              <p className="text-xs text-red-500 mt-1">Erreurs</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
              <p className="text-2xl font-bold text-slate-400">
                {mergeReport.skipped}
              </p>
              <p className="text-xs text-slate-500 mt-1">Ignorés</p>
            </div>
            <div className="p-4 bg-sky-900/20 rounded-lg border border-sky-800 text-center">
              <p className="text-2xl font-bold text-sky-400">
                {formatDuration(mergeReport.duration_ms)}
              </p>
              <p className="text-xs text-sky-500 mt-1">Durée</p>
            </div>
          </div>

          {/* Erreurs éventuelles */}
          {mergeReport.errors.length > 0 && (
            <div className="max-w-2xl mx-auto w-full bg-red-900/10 border border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                Erreurs ({mergeReport.errors.length})
              </h3>
              <div className="space-y-1 max-h-32 overflow-auto">
                {mergeReport.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-300">
                    <span className="font-mono">{err.file_path}</span> —{" "}
                    {err.error_message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <div
            ref={logRef}
            className="flex-1 bg-slate-900 rounded-lg border border-slate-700 p-4 overflow-auto font-mono text-xs min-h-0"
          >
            {mergeLogs.map((log, i) => (
              <div
                key={i}
                className={clsx(
                  "py-0.5",
                  log.level === "error" && "text-red-400",
                  log.level === "warning" && "text-yellow-400",
                  log.level === "info" && "text-slate-400"
                )}
              >
                {log.message}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter le rapport
            </button>
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Nouveau merge
            </button>
          </div>
        </>
      )}
    </div>
  );
}
