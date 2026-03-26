use crate::core::analyzer;
use crate::core::models::{AnalysisResult, FileEntry};

#[tauri::command]
pub async fn analyze_directories(
    source_files: Vec<FileEntry>,
    dest_files: Vec<FileEntry>,
) -> Result<AnalysisResult, String> {
    tokio::task::spawn_blocking(move || {
        Ok(analyzer::analyze_directories(&source_files, &dest_files))
    })
    .await
    .map_err(|e| format!("Erreur de thread : {}", e))?
}
