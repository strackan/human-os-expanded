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
    #[serde(default)]
    pub product: Option<String>,
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
    #[serde(default)]
    pub product: Option<String>,
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

// V3 Types (D&D Character Profile)
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CharacterProfile {
    #[serde(default)]
    pub tagline: Option<String>,
    #[serde(default)]
    pub alignment: Option<String>,
    #[serde(default)]
    pub race: Option<String>,
    #[serde(default, rename = "class")]
    pub character_class: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Attributes {
    #[serde(default, rename = "INT")]
    pub int: Option<f64>,
    #[serde(default, rename = "WIS")]
    pub wis: Option<f64>,
    #[serde(default, rename = "CHA")]
    pub cha: Option<f64>,
    #[serde(default, rename = "CON")]
    pub con: Option<f64>,
    #[serde(default, rename = "STR")]
    pub str_attr: Option<f64>,
    #[serde(default, rename = "DEX")]
    pub dex: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AssessmentSignals {
    #[serde(default)]
    pub enneagram_hint: Option<String>,
    #[serde(default)]
    pub interest_vectors: Option<Vec<String>>,
    #[serde(default)]
    pub social_energy: Option<String>,
    #[serde(default)]
    pub relationship_style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MatchingProfile {
    #[serde(default)]
    pub ideal_group_size: Option<String>,
    #[serde(default)]
    pub connection_style: Option<String>,
    #[serde(default)]
    pub energy_pattern: Option<String>,
    #[serde(default)]
    pub good_match_with: Option<Vec<String>>,
    #[serde(default)]
    pub avoid_match_with: Option<Vec<String>>,
}

// Full assessment results from API - supports both V1 and V3 formats
#[derive(Debug, Serialize, Deserialize)]
pub struct AssessmentResults {
    pub session_id: String,
    #[serde(default)]
    pub user_id: Option<String>,
    pub overall_score: f64,

    // V1 fields (work assessment) - optional for V3 compatibility
    #[serde(default)]
    pub archetype: Option<String>,
    #[serde(default)]
    pub archetype_confidence: Option<f64>,
    #[serde(default)]
    pub dimensions: Option<HashMap<String, f64>>,
    #[serde(default)]
    pub tier: Option<String>,
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

    // V3 fields (D&D character profile)
    #[serde(default)]
    pub character_profile: Option<CharacterProfile>,
    #[serde(default)]
    pub attributes: Option<Attributes>,
    #[serde(default)]
    pub signals: Option<AssessmentSignals>,
    #[serde(default)]
    pub matching: Option<MatchingProfile>,
    #[serde(default)]
    pub question_scores: Option<serde_json::Value>,
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
            product: None,
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
            product: None,
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
