use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("pet") {
                // Click-through is opt-in via the tray menu later; default is interactive.
                #[cfg(target_os = "macos")]
                {
                    // The macOS-private-api feature on the Cargo crate plus
                    // `macOSPrivateApi: true` in tauri.conf.json together enable
                    // real transparency on macOS. Without both, the window
                    // renders against an opaque background.
                    use tauri::Runtime;
                    let _ = window.set_decorations(false);
                    let _ = window.set_shadow(false);
                    let _: &dyn Runtime = window.runtime();
                }
                let _ = window.set_always_on_top(true);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running pet-genius desktop");
}
