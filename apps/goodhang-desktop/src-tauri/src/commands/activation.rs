use serde::{Deserialize, Serialize};
use std::collections::HashMap;

fn get_api_base_url() -> String {
    std::env::var("GOODHANG_API_URL")
        .unwrap_or_else(|_| "http://localhost:3200".to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssessmentPreview {
    pub tier: String,
    #[serde(rename = "archetypeHint")]
    pub archetype_hint: String,
    #[serde(rename = "overallScoreRange")]
    pub overall_score_range: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
    #[serde(rename = "hasExistingUser")]
    pub has_existing_user: Option<bool>,
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
    pub preview: Option<AssessmentPreview>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaimResult {
    pub success: bool,
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
    pub error: Option<String>,
}

// Personality profile from API
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PersonalityProfile {
    #[serde(default)]
    pub mbti: Option<String>,
    #[serde(default)]
    pub enneagram: Option<String>,
    #[serde(default)]
    pub enneagram_wing: Option<String>,
}

// Badge from API
#[derive(Debug, Serialize, Deserialize)]
pub struct Badge {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
}

// Full assessment results from API (snake_case to match server)
#[derive(Debug, Serialize, Deserialize)]
pub struct AssessmentResults {
    pub session_id: String,
    #[serde(default)]
    pub user_id: Option<String>,
    pub archetype: String,
    #[serde(default)]
    pub archetype_confidence: Option<f64>,
    pub overall_score: f64,
    pub dimensions: HashMap<String, f64>,
    pub tier: String,
    #[serde(default)]
    pub best_fit_roles: Option<Vec<String>>,
    #[serde(default)]
    pub personality_profile: Option<PersonalityProfile>,
    #[serde(default)]
    pub badges: Option<Vec<Badge>>,
    #[serde(default)]
    pub public_summary: Option<String>,
    #[serde(default)]
    pub detailed_summary: Option<String>,
    #[serde(default)]
    pub category_scores: Option<HashMap<String, f64>>,
}

#[tauri::command]
pub async fn validate_activation_key(code: String) -> Result<ValidationResult, String> {
    let client = reqwest::Client::new();

    let response = client
        .post(&format!("{}/api/activation/validate", get_api_base_url()))
        .json(&serde_json::json!({ "code": code }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Ok(ValidationResult {
            valid: false,
            session_id: None,
            has_existing_user: None,
            user_id: None,
            preview: None,
            error: Some(format!("Server error: {}", response.status())),
        });
    }

    response
        .json::<ValidationResult>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}

#[tauri::command]
pub async fn claim_activation_key(code: String, user_id: String) -> Result<ClaimResult, String> {
    let client = reqwest::Client::new();

    let response = client
        .post(&format!("{}/api/activation/claim", get_api_base_url()))
        .json(&serde_json::json!({
            "code": code,
            "userId": user_id
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Ok(ClaimResult {
            success: false,
            user_id: None,
            error: Some(format!("Server error: {}", response.status())),
        });
    }

    response
        .json::<ClaimResult>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}

#[tauri::command]
pub async fn fetch_assessment_results(session_id: String, token: String) -> Result<AssessmentResults, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(&format!("{}/api/assessment/{}/results", get_api_base_url(), session_id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Server error {}: {}", status, body));
    }

    response
        .json::<AssessmentResults>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}
