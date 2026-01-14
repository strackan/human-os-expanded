use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;
use std::path::PathBuf;

const STORE_FILENAME: &str = "auth.json";

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionData {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub token: String,
}

/// Permanent device registration - stores the activation code and refresh token
#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceRegistration {
    #[serde(rename = "activationCode")]
    pub activation_code: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub product: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
}

#[tauri::command]
pub async fn store_device_registration(
    app: tauri::AppHandle,
    activation_code: String,
    user_id: String,
    product: String,
    refresh_token: String,
) -> Result<(), String> {
    let registration = DeviceRegistration {
        activation_code,
        user_id,
        product,
        refresh_token,
    };

    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    store.set("device_registration", serde_json::to_value(&registration)
        .map_err(|e| format!("Failed to serialize registration: {}", e))?);

    store.save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    println!("[Auth] Device registration stored successfully");
    Ok(())
}

#[tauri::command]
pub async fn get_device_registration(app: tauri::AppHandle) -> Result<Option<DeviceRegistration>, String> {
    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    match store.get("device_registration") {
        Some(value) => {
            let registration: DeviceRegistration = serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to parse registration: {}", e))?;
            println!("[Auth] Device registration found: userId={}", registration.user_id);
            Ok(Some(registration))
        }
        None => {
            println!("[Auth] No device registration found");
            Ok(None)
        }
    }
}

#[tauri::command]
pub async fn clear_device_registration(app: tauri::AppHandle) -> Result<(), String> {
    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let _ = store.delete("device_registration"); // Returns bool, ignore result

    store.save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    println!("[Auth] Device registration cleared");
    Ok(())
}

#[tauri::command]
pub async fn store_session(
    app: tauri::AppHandle,
    user_id: String,
    session_id: String,
    token: String,
) -> Result<(), String> {
    let session = SessionData {
        user_id,
        session_id,
        token,
    };

    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    store.set("session", serde_json::to_value(&session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?);

    store.save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    println!("[Auth] Session stored successfully");
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionInfo {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub token: String,
}

#[tauri::command]
pub async fn get_session(app: tauri::AppHandle) -> Result<Option<SessionInfo>, String> {
    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    match store.get("session") {
        Some(value) => {
            let session: SessionData = serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to parse session: {}", e))?;

            println!("[Auth] Session found: userId={}", session.user_id);
            Ok(Some(SessionInfo {
                user_id: session.user_id,
                session_id: session.session_id,
                token: session.token,
            }))
        }
        None => {
            println!("[Auth] No session found");
            Ok(None)
        }
    }
}

#[tauri::command]
pub async fn clear_session(app: tauri::AppHandle) -> Result<(), String> {
    let store = app.store(PathBuf::from(STORE_FILENAME))
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let _ = store.delete("session"); // Ignore error if not exists

    store.save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    println!("[Auth] Session cleared");
    Ok(())
}
