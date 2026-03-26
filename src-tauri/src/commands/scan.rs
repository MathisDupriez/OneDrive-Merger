use tauri::AppHandle;

use crate::core::models::FileEntry;
use crate::core::scanner;

#[tauri::command]
pub async fn scan_directory(
    app: AppHandle,
    path: String,
    label: String,
    exclude_dirs: Vec<String>,
) -> Result<Vec<FileEntry>, String> {
    tokio::task::spawn_blocking(move || {
        scanner::scan_directory(&app, &path, &label, &exclude_dirs)
    })
    .await
    .map_err(|e| format!("Erreur de thread : {}", e))?
}
