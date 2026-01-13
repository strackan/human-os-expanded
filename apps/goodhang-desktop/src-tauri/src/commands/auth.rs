use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "com.goodhang.desktop";

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionData {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub token: String,
}

#[tauri::command]
pub async fn store_session(
    user_id: String,
    session_id: String,
    token: String,
) -> Result<(), String> {
    let session = SessionData {
        user_id,
        session_id,
        token,
    };

    let json = serde_json::to_string(&session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;

    let entry = Entry::new(SERVICE_NAME, "session")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .set_password(&json)
        .map_err(|e| format!("Failed to store session: {}", e))?;

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionInfo {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "sessionId")]
    pub session_id: String,
}

#[tauri::command]
pub async fn get_session() -> Result<Option<SessionInfo>, String> {
    let entry = Entry::new(SERVICE_NAME, "session")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    match entry.get_password() {
        Ok(json) => {
            let session: SessionData = serde_json::from_str(&json)
                .map_err(|e| format!("Failed to parse session: {}", e))?;

            Ok(Some(SessionInfo {
                user_id: session.user_id,
                session_id: session.session_id,
            }))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to get session: {}", e)),
    }
}

#[tauri::command]
pub async fn clear_session() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "session")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already cleared
        Err(e) => Err(format!("Failed to clear session: {}", e)),
    }
}
