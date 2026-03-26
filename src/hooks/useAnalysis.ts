import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useMergeStore } from "../stores/mergeStore";
import type { AnalysisResult } from "../types";

export function useAnalysis() {
  const {
    sourceFiles,
    destFiles,
    setAnalysisResult,
    setIsAnalyzing,
  } = useMergeStore();

  const startAnalysis = useCallback(async () => {
    if (sourceFiles.length === 0 && destFiles.length === 0) return;

    setIsAnalyzing(true);

    try {
      const result = await invoke<AnalysisResult>("analyze_directories", {
        sourceFiles,
        destFiles,
      });

      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sourceFiles, destFiles, setAnalysisResult, setIsAnalyzing]);

  return { startAnalysis };
}
