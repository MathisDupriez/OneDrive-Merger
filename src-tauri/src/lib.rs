mod commands;
mod core;
mod utils;

use commands::analyze::analyze_directories;
use commands::merge::{check_disk_space, execute_merge, export_report};
use commands::scan::scan_directory;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            analyze_directories,
            execute_merge,
            export_report,
            check_disk_space,
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors du lancement de l'application");
}
