export interface FileEntry {
  relative_path: string;
  file_name: string;
  extension: string;
  size: number;
  modified_at: number;
  hash: string;
  absolute_path: string;
}

export type FileCategory =
  | "Identical"
  | "Moved"
  | "Renamed"
  | "Modified"
  | "SourceOnly"
  | "DestOnly"
  | "Conflict";

export type MergeAction =
  | "Skip"
  | "CopyToDestination"
  | { KeepBoth: { suffix: string } }
  | "KeepSource"
  | "KeepDest"
  | { MoveInDest: { from: string; to: string } };

export interface AnalyzedFile {
  category: FileCategory;
  source_entry: FileEntry | null;
  dest_entry: FileEntry | null;
  suggested_action: MergeAction;
  selected_action: MergeAction;
  description: string;
}

export interface ScanProgress {
  total_files: number;
  scanned_files: number;
  current_file: string;
  phase: "discovering" | "hashing" | "complete";
  label: "source" | "destination";
}

export interface AnalysisResult {
  files: AnalyzedFile[];
  stats: AnalysisStats;
}

export interface AnalysisStats {
  total_source: number;
  total_dest: number;
  identical: number;
  moved: number;
  renamed: number;
  modified: number;
  source_only: number;
  dest_only: number;
  conflicts: number;
}

export interface MergeProgress {
  total_operations: number;
  completed_operations: number;
  current_operation: string;
  errors: MergeError[];
}

export interface MergeError {
  file_path: string;
  error_message: string;
}

export interface MergeReport {
  total_operations: number;
  successful: number;
  skipped: number;
  errors: MergeError[];
  duration_ms: number;
}

export interface MergeLogEntry {
  level: "info" | "warning" | "error";
  message: string;
}
