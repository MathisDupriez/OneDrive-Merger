import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useMergeStore } from "../stores/mergeStore";
import type { MergeProgress, MergeReport, MergeLogEntry } from "../types";

export function useMerge() {
  const {
    analysisResult,
    destPath,
    conflictSuffix,
    setMergeProgress,
    setMergeReport,
    setIsMerging,
    addMergeLog,
    clearMergeLogs,
  } = useMergeStore();

  const startMerge = useCallback(
    async (dryRun: boolean) => {
      if (!analysisResult || !destPath) return;

      setIsMerging(true);
      setMergeReport(null);
      if (!dryRun) clearMergeLogs();

      const unlistenProgress = await listen<MergeProgress>(
        "merge-progress",
        (event) => {
          setMergeProgress(event.payload);
        }
      );

      const unlistenLog = await listen<MergeLogEntry>(
        "merge-log",
        (event) => {
          addMergeLog(event.payload);
        }
      );

      try {
        const report = await invoke<MergeReport>("execute_merge", {
          operations: analysisResult.files,
          destRoot: destPath,
          dryRun,
          conflictSuffix,
        });

        setMergeReport(report);
      } finally {
        unlistenProgress();
        unlistenLog();
        setIsMerging(false);
      }
    },
    [
      analysisResult,
      destPath,
      conflictSuffix,
      setMergeProgress,
      setMergeReport,
      setIsMerging,
      addMergeLog,
      clearMergeLogs,
    ]
  );

  return { startMerge };
}
