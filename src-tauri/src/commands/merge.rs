use std::fs;

use tauri::AppHandle;

use crate::core::merger;
use crate::core::models::{AnalyzedFile, MergeReport};

#[tauri::command]
pub async fn execute_merge(
    app: AppHandle,
    operations: Vec<AnalyzedFile>,
    dest_root: String,
    dry_run: bool,
    conflict_suffix: String,
) -> Result<MergeReport, String> {
    tokio::task::spawn_blocking(move || {
        Ok(merger::execute_merge(
            &app,
            &operations,
            &dest_root,
            dry_run,
            &conflict_suffix,
        ))
    })
    .await
    .map_err(|e| format!("Erreur de thread : {}", e))?
}

#[tauri::command]
pub async fn export_report(report: MergeReport, output_path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&report)
        .map_err(|e| format!("Erreur de sérialisation : {}", e))?;
    fs::write(&output_path, json)
        .map_err(|e| format!("Impossible d'écrire le rapport : {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn check_disk_space(path: String) -> Result<u64, String> {
    // Utiliser la commande système pour obtenir l'espace libre
    let metadata = fs::metadata(&path).map_err(|e| format!("Erreur : {}", e))?;
    // Sur Windows, on ne peut pas facilement obtenir l'espace disque avec std seul
    // On retourne juste une valeur pour indiquer que le chemin est accessible
    drop(metadata);
    Ok(u64::MAX) // Simplification — la vérification réelle se fait à la copie
}
