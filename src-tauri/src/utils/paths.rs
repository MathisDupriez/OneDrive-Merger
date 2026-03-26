use std::path::Path;

/// Préfixe les chemins longs Windows avec \\?\ pour dépasser la limite de 260 caractères.
pub fn normalize_long_path(path: &str) -> String {
    if cfg!(windows) && path.len() > 240 && !path.starts_with("\\\\?\\") {
        format!("\\\\?\\{}", path.replace('/', "\\"))
    } else {
        path.to_string()
    }
}

/// Liste des fichiers à ignorer par défaut lors du scan.
const IGNORED_FILES: &[&str] = &[
    "desktop.ini",
    "Thumbs.db",
    ".DS_Store",
];

const IGNORED_PREFIXES: &[&str] = &["~$"];
const IGNORED_EXTENSIONS: &[&str] = &["tmp", "lnk"];

/// Vérifie si un fichier doit être ignoré lors du scan.
pub fn should_ignore(path: &Path) -> bool {
    let file_name = match path.file_name().and_then(|n| n.to_str()) {
        Some(name) => name,
        None => return true,
    };

    // Fichiers ignorés par nom exact
    if IGNORED_FILES.iter().any(|&f| f.eq_ignore_ascii_case(file_name)) {
        return true;
    }

    // Fichiers ignorés par préfixe
    if IGNORED_PREFIXES.iter().any(|&p| file_name.starts_with(p)) {
        return true;
    }

    // Fichiers ignorés par extension
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if IGNORED_EXTENSIONS.iter().any(|&e| e.eq_ignore_ascii_case(ext)) {
            return true;
        }
    }

    false
}
