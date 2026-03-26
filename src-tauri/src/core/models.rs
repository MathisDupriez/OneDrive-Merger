use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    /// Chemin relatif depuis la racine du dossier scanné
    pub relative_path: String,
    /// Nom du fichier uniquement
    pub file_name: String,
    /// Extension (sans le point)
    pub extension: String,
    /// Taille en bytes
    pub size: u64,
    /// Timestamp de dernière modification (epoch ms)
    pub modified_at: i64,
    /// Hash SHA-256 (hex string)
    pub hash: String,
    /// Chemin absolu (pour les opérations)
    pub absolute_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum FileCategory {
    /// Même chemin + même hash
    Identical,
    /// Même hash, chemin différent
    Moved,
    /// Même hash, même dossier parent, nom différent
    Renamed,
    /// Même chemin relatif, hash différent
    Modified,
    /// Existe uniquement dans la source
    SourceOnly,
    /// Existe uniquement dans la destination
    DestOnly,
    /// Cas ambigu nécessitant décision utilisateur
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MergeAction {
    /// Ne rien faire
    Skip,
    /// Copier de source vers destination
    CopyToDestination,
    /// Garder les deux versions (ajouter suffixe)
    KeepBoth { suffix: String },
    /// Garder uniquement la version source
    KeepSource,
    /// Garder uniquement la version destination
    KeepDest,
    /// Déplacer dans la destination
    MoveInDest { from: String, to: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzedFile {
    pub category: FileCategory,
    pub source_entry: Option<FileEntry>,
    pub dest_entry: Option<FileEntry>,
    pub suggested_action: MergeAction,
    /// Peut être modifié par l'utilisateur via l'UI
    pub selected_action: MergeAction,
    /// Description lisible de la situation
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub total_files: usize,
    pub scanned_files: usize,
    pub current_file: String,
    pub phase: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub files: Vec<AnalyzedFile>,
    pub stats: AnalysisStats,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AnalysisStats {
    pub total_source: usize,
    pub total_dest: usize,
    pub identical: usize,
    pub moved: usize,
    pub renamed: usize,
    pub modified: usize,
    pub source_only: usize,
    pub dest_only: usize,
    pub conflicts: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeProgress {
    pub total_operations: usize,
    pub completed_operations: usize,
    pub current_operation: String,
    pub errors: Vec<MergeError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeError {
    pub file_path: String,
    pub error_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeReport {
    pub total_operations: usize,
    pub successful: usize,
    pub skipped: usize,
    pub errors: Vec<MergeError>,
    pub duration_ms: u64,
}
