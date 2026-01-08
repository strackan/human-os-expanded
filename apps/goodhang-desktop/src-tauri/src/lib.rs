mod commands;

use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

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
                app.deep_link().on_open_url(move |event: tauri_plugin_deep_link::OpenUrlEvent| {
                    for url in event.urls() {
                        if url.scheme() == "goodhang" {
                            // Extract activation code from path
                            // URL format: goodhang://activate/GH-XXXX-XXXX
                            let path = url.path();
                            // Handle both "/activate/CODE" and "activate/CODE" (Windows may omit leading slash)
                            let code = path
                                .strip_prefix("/activate/")
                                .or_else(|| path.strip_prefix("activate/"))
                                .or_else(|| path.strip_prefix("/"))
                                .unwrap_or(path);

                            if !code.is_empty() {
                                if let Some(window) = handle.get_webview_window("main") {
                                    println!("Deep link received: code={}", code);
                                    let _ = window.emit("activation-code", code);
                                    // Focus the window
                                    let _ = window.set_focus();
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
