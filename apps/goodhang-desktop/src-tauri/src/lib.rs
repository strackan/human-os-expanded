mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Handle deep links
            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        if url.scheme() == "goodhang" {
                            if let Some(code) = url.path().strip_prefix("/activate/") {
                                if let Some(window) = handle.get_webview_window("main") {
                                    let _ = window.emit("activation-code", code);
                                }
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::activation::validate_activation_key,
            commands::activation::claim_activation_key,
            commands::activation::fetch_assessment_results,
            commands::auth::store_session,
            commands::auth::get_session,
            commands::auth::clear_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
