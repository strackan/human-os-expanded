use serde::{Deserialize, Serialize};
use std::collections::HashMap;

fn get_api_base_url() -> String {
    std::env::var("GOODHANG_API_URL")
        .unwrap_or_else(|_| "https://goodhang-staging.vercel.app".to_string())
}

// Assessment status
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GoodHangAssessment {
    pub completed: bool,
    pub status: String,
    pub tier: Option<String>,
    pub archetype: Option<String>,
    pub overall_score: Option<f64>,
    #[serde(default)]
    pub dimensions: Option<HashMap<String, f64>>,
    #[serde(default)]
    pub badges: Option<Vec<String>>,
    pub session_id: Option<String>,
}

// Sculptor status
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SculptorStatus {
    pub completed: bool,
    pub status: String,
    pub transcript_available: bool,
}

// Identity profile status
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct IdentityProfile {
    pub completed: bool,
    pub annual_theme: Option<String>,
    #[serde(default)]
    pub core_values: Option<Vec<String>>,
}

// Product statuses
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GoodHangProduct {
    pub enabled: bool,
    pub assessment: Option<GoodHangAssessment>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FounderOSProduct {
    pub enabled: bool,
    pub sculptor: Option<SculptorStatus>,
    pub identity_profile: Option<IdentityProfile>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VoiceOSProduct {
    pub enabled: bool,
    pub context_files_count: i32,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Products {
    pub goodhang: GoodHangProduct,
    pub founder_os: FounderOSProduct,
    pub voice_os: VoiceOSProduct,
}

// User info
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UserInfo {
    pub id: String,
    pub email: Option<String>,
    pub full_name: Option<String>,
}

// Entities info
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct EntitiesInfo {
    pub count: i32,
    pub has_entity: bool,
}

// Contexts info
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ContextsInfo {
    #[serde(default)]
    pub available: Vec<String>,
    pub active: Option<String>,
}

// Full user status response
#[derive(Debug, Serialize, Deserialize)]
pub struct UserStatus {
    pub found: bool,
    pub user: Option<UserInfo>,
    pub products: Products,
    pub entities: EntitiesInfo,
    pub contexts: ContextsInfo,
    pub recommended_action: String,
}

impl Default for UserStatus {
    fn default() -> Self {
        Self {
            found: false,
            user: None,
            products: Products::default(),
            entities: EntitiesInfo::default(),
            contexts: ContextsInfo::default(),
            recommended_action: "start_onboarding".to_string(),
        }
    }
}

#[tauri::command]
pub async fn fetch_user_status(
    token: String,
    user_id: Option<String>,
) -> Result<UserStatus, String> {
    let client = reqwest::Client::new();

    // Build URL with query params
    let mut url = format!("{}/api/user/status", get_api_base_url());
    if let Some(id) = &user_id {
        url = format!("{}?userId={}", url, id);
    }

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        if status.as_u16() == 404 {
            // User not found, return default status
            return Ok(UserStatus::default());
        }
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Server error {}: {}", status, body));
    }

    response
        .json::<UserStatus>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}
