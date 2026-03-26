import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useMergeStore } from "../stores/mergeStore";
import type { FileEntry, ScanProgress } from "../types";

export function useScan() {
  const {
    sourcePath,
    destPath,
    excludeDirs,
    setSourceFiles,
    setDestFiles,
    setScanProgress,
    setIsScanning,
  } = useMergeStore();

  const startScan = useCallback(async () => {
    if (!sourcePath || !destPath) return;

    setIsScanning(true);

    const unlisten = await listen<ScanProgress>("scan-progress", (event) => {
      setScanProgress(event.payload.label, event.payload);
    });

    try {
      const [sourceResult, destResult] = await Promise.all([
        invoke<FileEntry[]>("scan_directory", {
          path: sourcePath,
          label: "source",
          excludeDirs,
        }),
        invoke<FileEntry[]>("scan_directory", {
          path: destPath,
          label: "destination",
          excludeDirs,
        }),
      ]);

      setSourceFiles(sourceResult);
      setDestFiles(destResult);
    } finally {
      unlisten();
      setIsScanning(false);
    }
  }, [sourcePath, destPath, excludeDirs, setSourceFiles, setDestFiles, setScanProgress, setIsScanning]);

  return { startScan };
}
