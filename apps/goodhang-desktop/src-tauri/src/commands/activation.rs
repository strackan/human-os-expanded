use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const API_BASE_URL: &str = "https://api.goodhang.com"; // TODO: Make configurable

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

#[derive(Debug, Serialize, Deserialize)]
pub struct Personality {
    pub mbti: String,
    pub enneagram: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssessmentResults {
    #[serde(rename = "sessionId")]
    pub session_id: String,
    pub archetype: String,
    pub tier: String,
    pub personality: Personality,
    pub dimensions: HashMap<String, f64>,
    pub badges: Vec<String>,
    pub summary: String,
}

#[tauri::command]
pub async fn validate_activation_key(code: String) -> Result<ValidationResult, String> {
    let client = reqwest::Client::new();

    let response = client
        .post(&format!("{}/api/activation/validate", API_BASE_URL))
        .json(&serde_json::json!({ "code": code }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Ok(ValidationResult {
            valid: false,
            session_id: None,
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
        .post(&format!("{}/api/activation/claim", API_BASE_URL))
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
pub async fn fetch_assessment_results(session_id: String) -> Result<AssessmentResults, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(&format!("{}/api/assessment/{}/results", API_BASE_URL, session_id))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Server error: {}", response.status()));
    }

    response
        .json::<AssessmentResults>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}
