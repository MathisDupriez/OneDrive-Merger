use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::UNIX_EPOCH;

use rayon::prelude::*;
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

use super::hasher::hash_file;
use super::models::{FileEntry, ScanProgress};
use crate::utils::paths::{normalize_long_path, should_ignore};

/// Données collectées pendant la phase de découverte (avant hashing).
struct RawFile {
    relative_path: String,
    file_name: String,
    extension: String,
    absolute_path: String,
    size: u64,
    modified_at: i64,
}

/// Scanne un répertoire, calcule les hashes en parallèle avec rayon.
/// `exclude_dirs` contient les noms de dossiers à ignorer (ex: "node_modules", ".git").
pub fn scan_directory(
    app: &AppHandle,
    root_path: &str,
    label: &str,
    exclude_dirs: &[String],
) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(root_path);
    if !root.exists() {
        return Err(format!("Le dossier n'existe pas : {}", root_path));
    }
    if !root.is_dir() {
        return Err(format!("Le chemin n'est pas un dossier : {}", root_path));
    }

    // Phase 1 : Découverte des fichiers
    let _ = app.emit(
        "scan-progress",
        ScanProgress {
            total_files: 0,
            scanned_files: 0,
            current_file: String::new(),
            phase: "discovering".to_string(),
            label: label.to_string(),
        },
    );

    let mut raw_files: Vec<RawFile> = Vec::new();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            // Exclure les dossiers spécifiés par l'utilisateur
            if e.file_type().is_dir() {
                if let Some(name) = e.file_name().to_str() {
                    return !exclude_dirs.iter().any(|ex| ex.eq_ignore_ascii_case(name));
                }
            }
            true
        })
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        if should_ignore(path) {
            continue;
        }

        let relative = match path.strip_prefix(root) {
            Ok(r) => r.to_string_lossy().to_string().replace('\\', "/"),
            Err(_) => continue,
        };

        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let extension = path
            .extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_default();

        let absolute = normalize_long_path(&path.to_string_lossy());

        let metadata = match path.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let size = metadata.len();
        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);

        raw_files.push(RawFile {
            relative_path: relative,
            file_name,
            extension,
            absolute_path: absolute,
            size,
            modified_at,
        });
    }

    let total = raw_files.len();

    let _ = app.emit(
        "scan-progress",
        ScanProgress {
            total_files: total,
            scanned_files: 0,
            current_file: String::new(),
            phase: "hashing".to_string(),
            label: label.to_string(),
        },
    );

    // Phase 2 : Hashing PARALLÈLE avec rayon (utilise tous les CPU cores)
    let counter = Arc::new(AtomicUsize::new(0));
    let app_clone = app.clone();
    let label_owned = label.to_string();
    let emit_interval = std::cmp::max(1, total / 100);

    let entries: Vec<FileEntry> = raw_files
        .into_par_iter()
        .map(|raw| {
            let hash = match hash_file(&raw.absolute_path) {
                Ok(h) => h,
                Err(_) => String::new(),
            };

            let count = counter.fetch_add(1, Ordering::Relaxed) + 1;

            // Émettre la progression périodiquement
            if count % emit_interval == 0 || count == total {
                let _ = app_clone.emit(
                    "scan-progress",
                    ScanProgress {
                        total_files: total,
                        scanned_files: count,
                        current_file: raw.absolute_path.clone(),
                        phase: "hashing".to_string(),
                        label: label_owned.clone(),
                    },
                );
            }

            FileEntry {
                relative_path: raw.relative_path,
                file_name: raw.file_name,
                extension: raw.extension,
                size: raw.size,
                modified_at: raw.modified_at,
                hash,
                absolute_path: raw.absolute_path,
            }
        })
        .collect();

    let _ = app.emit(
        "scan-progress",
        ScanProgress {
            total_files: total,
            scanned_files: total,
            current_file: String::new(),
            phase: "complete".to_string(),
            label: label.to_string(),
        },
    );

    Ok(entries)
}
