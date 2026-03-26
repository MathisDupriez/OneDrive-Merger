use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;

use rayon::prelude::*;

/// Calcule le hash SHA-256 d'un fichier par chunks de 64 Ko.
pub fn hash_file(path: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 65536]; // 64 KB chunks
    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

/// Hash en parallèle avec rayon — utilise tous les cores CPU.
pub fn hash_files_parallel(paths: &[String]) -> Vec<(String, Result<String, String>)> {
    paths
        .par_iter()
        .map(|p| {
            let result = hash_file(p).map_err(|e| e.to_string());
            (p.clone(), result)
        })
        .collect()
}
