use std::fs;
use std::path::Path;
use std::time::Instant;

use tauri::{AppHandle, Emitter};

use super::models::*;
use crate::utils::paths::normalize_long_path;

/// Exécute les opérations de merge selon les actions sélectionnées.
pub fn execute_merge(
    app: &AppHandle,
    operations: &[AnalyzedFile],
    dest_root: &str,
    dry_run: bool,
    conflict_suffix: &str,
) -> MergeReport {
    let start = Instant::now();
    let mut successful = 0usize;
    let mut skipped = 0usize;
    let mut errors: Vec<MergeError> = Vec::new();

    let actionable: Vec<&AnalyzedFile> = operations
        .iter()
        .filter(|f| f.selected_action != MergeAction::Skip)
        .collect();
    let total = actionable.len();

    for (i, analyzed) in actionable.iter().enumerate() {
        let description = describe_operation(analyzed, conflict_suffix);

        let _ = app.emit(
            "merge-progress",
            MergeProgress {
                total_operations: total,
                completed_operations: i,
                current_operation: description.clone(),
                errors: errors.clone(),
            },
        );

        if dry_run {
            let _ = app.emit(
                "merge-log",
                serde_json::json!({
                    "level": "info",
                    "message": format!("[DRY] {}", description)
                }),
            );
            successful += 1;
            continue;
        }

        match execute_single_operation(analyzed, dest_root, conflict_suffix) {
            Ok(()) => {
                successful += 1;
                let _ = app.emit(
                    "merge-log",
                    serde_json::json!({
                        "level": "info",
                        "message": format!("[OK] {}", description)
                    }),
                );
            }
            Err(e) => {
                let file_path = analyzed
                    .source_entry
                    .as_ref()
                    .map(|f| f.relative_path.clone())
                    .unwrap_or_else(|| {
                        analyzed
                            .dest_entry
                            .as_ref()
                            .map(|f| f.relative_path.clone())
                            .unwrap_or_default()
                    });
                errors.push(MergeError {
                    file_path: file_path.clone(),
                    error_message: e.clone(),
                });
                let _ = app.emit(
                    "merge-log",
                    serde_json::json!({
                        "level": "error",
                        "message": format!("[ERR] {} — {}", file_path, e)
                    }),
                );
            }
        }
    }

    // Compter les fichiers skippés
    skipped = operations
        .iter()
        .filter(|f| f.selected_action == MergeAction::Skip)
        .count();

    let duration_ms = start.elapsed().as_millis() as u64;

    let _ = app.emit(
        "merge-progress",
        MergeProgress {
            total_operations: total,
            completed_operations: total,
            current_operation: "Terminé".to_string(),
            errors: errors.clone(),
        },
    );

    MergeReport {
        total_operations: total,
        successful,
        skipped,
        errors,
        duration_ms,
    }
}

fn execute_single_operation(
    analyzed: &AnalyzedFile,
    dest_root: &str,
    conflict_suffix: &str,
) -> Result<(), String> {
    match &analyzed.selected_action {
        MergeAction::Skip => Ok(()),

        MergeAction::CopyToDestination => {
            let src = analyzed
                .source_entry
                .as_ref()
                .ok_or("Pas de fichier source")?;
            let dest_path = Path::new(dest_root).join(&src.relative_path);
            let dest_str = normalize_long_path(&dest_path.to_string_lossy());

            // Créer les dossiers parents
            if let Some(parent) = Path::new(&dest_str).parent() {
                fs::create_dir_all(parent).map_err(|e| {
                    format!("Impossible de créer le dossier {} : {}", parent.display(), e)
                })?;
            }

            let src_str = normalize_long_path(&src.absolute_path);
            fs::copy(&src_str, &dest_str).map_err(|e| {
                format!("Impossible de copier {} : {}", src.relative_path, e)
            })?;

            Ok(())
        }

        MergeAction::KeepBoth { suffix: _ } => {
            let src = analyzed
                .source_entry
                .as_ref()
                .ok_or("Pas de fichier source")?;
            // Construire le chemin avec suffixe
            let dest_path = Path::new(dest_root).join(&src.relative_path);
            let stem = dest_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("file");
            let ext = dest_path
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| format!(".{}", e))
                .unwrap_or_default();
            let parent = dest_path
                .parent()
                .unwrap_or_else(|| Path::new(dest_root));

            let suffixed_name = format!("{}{}{}", stem, conflict_suffix, ext);
            let suffixed_path = parent.join(&suffixed_name);
            let suffixed_str = normalize_long_path(&suffixed_path.to_string_lossy());

            // Créer les dossiers parents
            fs::create_dir_all(parent).map_err(|e| {
                format!("Impossible de créer le dossier {} : {}", parent.display(), e)
            })?;

            let src_str = normalize_long_path(&src.absolute_path);
            fs::copy(&src_str, &suffixed_str).map_err(|e| {
                format!("Impossible de copier {} : {}", src.relative_path, e)
            })?;

            Ok(())
        }

        MergeAction::KeepSource => {
            let src = analyzed
                .source_entry
                .as_ref()
                .ok_or("Pas de fichier source")?;
            let dest_path = Path::new(dest_root).join(&src.relative_path);
            let dest_str = normalize_long_path(&dest_path.to_string_lossy());

            if let Some(parent) = Path::new(&dest_str).parent() {
                fs::create_dir_all(parent).map_err(|e| {
                    format!("Impossible de créer le dossier {} : {}", parent.display(), e)
                })?;
            }

            let src_str = normalize_long_path(&src.absolute_path);
            fs::copy(&src_str, &dest_str).map_err(|e| {
                format!("Impossible d'écraser {} : {}", src.relative_path, e)
            })?;

            Ok(())
        }

        MergeAction::KeepDest => Ok(()),

        MergeAction::MoveInDest { from, to } => {
            let from_path = Path::new(dest_root).join(from);
            let to_path = Path::new(dest_root).join(to);
            let from_str = normalize_long_path(&from_path.to_string_lossy());
            let to_str = normalize_long_path(&to_path.to_string_lossy());

            if let Some(parent) = Path::new(&to_str).parent() {
                fs::create_dir_all(parent).map_err(|e| {
                    format!("Impossible de créer le dossier {} : {}", parent.display(), e)
                })?;
            }

            fs::rename(&from_str, &to_str).map_err(|e| {
                format!("Impossible de déplacer {} → {} : {}", from, to, e)
            })?;

            Ok(())
        }
    }
}

fn describe_operation(analyzed: &AnalyzedFile, conflict_suffix: &str) -> String {
    let path = analyzed
        .source_entry
        .as_ref()
        .map(|f| f.relative_path.as_str())
        .unwrap_or("?");

    match &analyzed.selected_action {
        MergeAction::Skip => format!("Ignoré : {}", path),
        MergeAction::CopyToDestination => format!("Copié : {}", path),
        MergeAction::KeepBoth { .. } => {
            format!("Gardé les deux ({}) : {}", conflict_suffix, path)
        }
        MergeAction::KeepSource => format!("Écrasé par source : {}", path),
        MergeAction::KeepDest => format!("Gardé destination : {}", path),
        MergeAction::MoveInDest { from, to } => format!("Déplacé : {} → {}", from, to),
    }
}
