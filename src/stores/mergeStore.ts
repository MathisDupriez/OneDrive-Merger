import { create } from "zustand";
import type {
  FileEntry,
  FileCategory,
  AnalysisResult,
  ScanProgress,
  MergeProgress,
  MergeReport,
  MergeLogEntry,
} from "../types";

interface MergeStore {
  // Step tracking
  currentStep: 1 | 2 | 3 | 4;
  setStep: (step: 1 | 2 | 3 | 4) => void;

  // Step 1: Folder selection
  sourcePath: string | null;
  destPath: string | null;
  setSourcePath: (p: string | null) => void;
  setDestPath: (p: string | null) => void;

  // Step 2: Scan results
  sourceFiles: FileEntry[];
  destFiles: FileEntry[];
  setSourceFiles: (files: FileEntry[]) => void;
  setDestFiles: (files: FileEntry[]) => void;
  scanProgressSource: ScanProgress | null;
  scanProgressDest: ScanProgress | null;
  setScanProgress: (label: string, progress: ScanProgress) => void;
  isScanning: boolean;
  setIsScanning: (v: boolean) => void;

  // Step 3: Analysis
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (r: AnalysisResult | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  // Filters
  activeFilters: Set<FileCategory>;
  toggleFilter: (cat: FileCategory) => void;
  setActiveFilters: (filters: Set<FileCategory>) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Step 4: Merge
  mergeProgress: MergeProgress | null;
  setMergeProgress: (p: MergeProgress | null) => void;
  mergeReport: MergeReport | null;
  setMergeReport: (r: MergeReport | null) => void;
  isMerging: boolean;
  setIsMerging: (v: boolean) => void;
  mergeLogs: MergeLogEntry[];
  addMergeLog: (entry: MergeLogEntry) => void;
  clearMergeLogs: () => void;

  // Settings
  conflictSuffix: string;
  setConflictSuffix: (s: string) => void;
  excludeDirs: string[];
  setExcludeDirs: (dirs: string[]) => void;
  addExcludeDir: (dir: string) => void;
  removeExcludeDir: (dir: string) => void;

  // Actions
  reset: () => void;
  updateFileAction: (index: number, action: import("../types").MergeAction) => void;
}

const initialState = {
  currentStep: 1 as const,
  sourcePath: null,
  destPath: null,
  sourceFiles: [],
  destFiles: [],
  scanProgressSource: null,
  scanProgressDest: null,
  isScanning: false,
  analysisResult: null,
  isAnalyzing: false,
  activeFilters: new Set<FileCategory>(),
  searchQuery: "",
  mergeProgress: null,
  mergeReport: null,
  isMerging: false,
  mergeLogs: [] as MergeLogEntry[],
  conflictSuffix: "_ANCIEN",
  excludeDirs: [] as string[],
};

export const useMergeStore = create<MergeStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setSourcePath: (p) => set({ sourcePath: p }),
  setDestPath: (p) => set({ destPath: p }),
  setSourceFiles: (files) => set({ sourceFiles: files }),
  setDestFiles: (files) => set({ destFiles: files }),
  setScanProgress: (label, progress) =>
    set(
      label === "source"
        ? { scanProgressSource: progress }
        : { scanProgressDest: progress }
    ),
  setIsScanning: (v) => set({ isScanning: v }),
  setAnalysisResult: (r) => set({ analysisResult: r }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),

  toggleFilter: (cat) =>
    set((state) => {
      const next = new Set(state.activeFilters);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return { activeFilters: next };
    }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  setMergeProgress: (p) => set({ mergeProgress: p }),
  setMergeReport: (r) => set({ mergeReport: r }),
  setIsMerging: (v) => set({ isMerging: v }),
  addMergeLog: (entry) =>
    set((state) => ({ mergeLogs: [...state.mergeLogs, entry] })),
  clearMergeLogs: () => set({ mergeLogs: [] }),

  setConflictSuffix: (s) => set({ conflictSuffix: s }),
  setExcludeDirs: (dirs) => set({ excludeDirs: dirs }),
  addExcludeDir: (dir) =>
    set((state) => ({
      excludeDirs: state.excludeDirs.includes(dir)
        ? state.excludeDirs
        : [...state.excludeDirs, dir],
    })),
  removeExcludeDir: (dir) =>
    set((state) => ({
      excludeDirs: state.excludeDirs.filter((d) => d !== dir),
    })),

  updateFileAction: (index, action) =>
    set((state) => {
      if (!state.analysisResult) return state;
      const files = [...state.analysisResult.files];
      files[index] = { ...files[index], selected_action: action };
      return {
        analysisResult: { ...state.analysisResult, files },
      };
    }),

  reset: () =>
    set({
      ...initialState,
      activeFilters: new Set<FileCategory>(),
      mergeLogs: [],
    }),
}));
