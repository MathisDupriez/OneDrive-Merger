use std::collections::{HashMap, HashSet};
use std::path::Path;

use super::models::*;

/// Analyse les fichiers source et destination avec l'algorithme de matching en 4 passes.
pub fn analyze_directories(
    source_files: &[FileEntry],
    dest_files: &[FileEntry],
) -> AnalysisResult {
    let mut results: Vec<AnalyzedFile> = Vec::new();
    let mut stats = AnalysisStats {
        total_source: source_files.len(),
        total_dest: dest_files.len(),
        ..Default::default()
    };

    // Index pour accélérer les recherches
    let mut dest_by_path: HashMap<&str, usize> = HashMap::new();
    let mut dest_by_hash: HashMap<&str, Vec<usize>> = HashMap::new();
    let mut dest_by_name_size: HashMap<(&str, u64), Vec<usize>> = HashMap::new();

    for (i, entry) in dest_files.iter().enumerate() {
        dest_by_path.insert(&entry.relative_path, i);
        if !entry.hash.is_empty() {
            dest_by_hash
                .entry(&entry.hash)
                .or_default()
                .push(i);
        }
        dest_by_name_size
            .entry((&entry.file_name, entry.size))
            .or_default()
            .push(i);
    }

    let mut matched_source: HashSet<usize> = HashSet::new();
    let mut matched_dest: HashSet<usize> = HashSet::new();

    // ═══════════════════════════════════════════════════════════
    // PASS 1 — Match par chemin relatif exact
    // ═══════════════════════════════════════════════════════════
    for (si, src) in source_files.iter().enumerate() {
        if let Some(&di) = dest_by_path.get(src.relative_path.as_str()) {
            let dest = &dest_files[di];
            matched_source.insert(si);
            matched_dest.insert(di);

            if src.hash == dest.hash && !src.hash.is_empty() {
                // Fichiers identiques
                stats.identical += 1;
                results.push(AnalyzedFile {
                    category: FileCategory::Identical,
                    source_entry: Some(src.clone()),
                    dest_entry: Some(dest.clone()),
                    suggested_action: MergeAction::Skip,
                    selected_action: MergeAction::Skip,
                    description: "Fichier identique dans les deux dossiers".to_string(),
                });
            } else {
                // Même chemin, contenu différent
                stats.modified += 1;
                let action = MergeAction::KeepBoth {
                    suffix: "_ANCIEN".to_string(),
                };
                results.push(AnalyzedFile {
                    category: FileCategory::Modified,
                    source_entry: Some(src.clone()),
                    dest_entry: Some(dest.clone()),
                    suggested_action: action.clone(),
                    selected_action: action,
                    description: format!(
                        "Fichier modifié — source : {} octets, dest : {} octets",
                        src.size, dest.size
                    ),
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PASS 2 — Match par hash SHA-256 (déplacements/renommages)
    // ═══════════════════════════════════════════════════════════
    for (si, src) in source_files.iter().enumerate() {
        if matched_source.contains(&si) || src.hash.is_empty() {
            continue;
        }

        if let Some(dest_indices) = dest_by_hash.get(src.hash.as_str()) {
            // Trouver un fichier destination non matché avec le même hash
            if let Some(&di) = dest_indices.iter().find(|&&di| !matched_dest.contains(&di)) {
                let dest = &dest_files[di];
                matched_source.insert(si);
                matched_dest.insert(di);

                let src_parent = parent_dir(&src.relative_path);
                let dest_parent = parent_dir(&dest.relative_path);

                if src_parent == dest_parent {
                    // Même dossier parent = renommé
                    stats.renamed += 1;
                    results.push(AnalyzedFile {
                        category: FileCategory::Renamed,
                        source_entry: Some(src.clone()),
                        dest_entry: Some(dest.clone()),
                        suggested_action: MergeAction::Skip,
                        selected_action: MergeAction::Skip,
                        description: format!(
                            "Fichier renommé : {} → {}",
                            src.file_name, dest.file_name
                        ),
                    });
                } else {
                    // Dossier parent différent = déplacé
                    stats.moved += 1;
                    results.push(AnalyzedFile {
                        category: FileCategory::Moved,
                        source_entry: Some(src.clone()),
                        dest_entry: Some(dest.clone()),
                        suggested_action: MergeAction::Skip,
                        selected_action: MergeAction::Skip,
                        description: format!(
                            "Fichier déplacé : {} → {}",
                            src.relative_path, dest.relative_path
                        ),
                    });
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PASS 3 — Match par nom + taille (fichiers légèrement modifiés)
    // ═══════════════════════════════════════════════════════════
    for (si, src) in source_files.iter().enumerate() {
        if matched_source.contains(&si) {
            continue;
        }

        let key = (src.file_name.as_str(), src.size);
        if let Some(dest_indices) = dest_by_name_size.get(&key) {
            if let Some(&di) = dest_indices.iter().find(|&&di| !matched_dest.contains(&di)) {
                let dest = &dest_files[di];
                matched_source.insert(si);
                matched_dest.insert(di);

                stats.conflicts += 1;
                let action = MergeAction::KeepBoth {
                    suffix: "_ANCIEN".to_string(),
                };
                results.push(AnalyzedFile {
                    category: FileCategory::Conflict,
                    source_entry: Some(src.clone()),
                    dest_entry: Some(dest.clone()),
                    suggested_action: action.clone(),
                    selected_action: action,
                    description: format!(
                        "Conflit — même nom et taille, contenu différent : {}",
                        src.file_name
                    ),
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PASS 4 — Fichiers restants (uniques)
    // ═══════════════════════════════════════════════════════════
    for (si, src) in source_files.iter().enumerate() {
        if matched_source.contains(&si) {
            continue;
        }
        stats.source_only += 1;
        results.push(AnalyzedFile {
            category: FileCategory::SourceOnly,
            source_entry: Some(src.clone()),
            dest_entry: None,
            suggested_action: MergeAction::CopyToDestination,
            selected_action: MergeAction::CopyToDestination,
            description: format!("Existe uniquement dans la source : {}", src.relative_path),
        });
    }

    for (di, dest) in dest_files.iter().enumerate() {
        if matched_dest.contains(&di) {
            continue;
        }
        stats.dest_only += 1;
        results.push(AnalyzedFile {
            category: FileCategory::DestOnly,
            source_entry: None,
            dest_entry: Some(dest.clone()),
            suggested_action: MergeAction::Skip,
            selected_action: MergeAction::Skip,
            description: format!(
                "Existe uniquement dans la destination : {}",
                dest.relative_path
            ),
        });
    }

    AnalysisResult {
        files: results,
        stats,
    }
}

/// Extrait le dossier parent d'un chemin relatif.
fn parent_dir(relative_path: &str) -> &str {
    Path::new(relative_path)
        .parent()
        .and_then(|p| p.to_str())
        .unwrap_or("")
}
