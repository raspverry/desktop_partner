// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMResponse {
    pub text: String,
    pub tokens_used: Option<u32>,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmotionAnalysis {
    pub emotion: String,
    pub confidence: f32,
    pub intensity: f32,
}

#[tauri::command]
async fn generate_response(prompt: String) -> Result<LLMResponse, String> {
    let response = LLMResponse {
        text: format!("로컬 LLM 응답: {}", prompt),
        tokens_used: Some(prompt.len() as u32),
        model: "phi-3.5-mini".to_string(),
    };
    Ok(response)
}

#[tauri::command]
async fn analyze_emotion(text: String) -> Result<EmotionAnalysis, String> {
    let emotion = if text.contains("기쁘") || text.contains("좋") {
        "happy"
    } else if text.contains("슬프") || text.contains("우울") {
        "sad"
    } else if text.contains("화나") || text.contains("분노") {
        "angry"
    } else {
        "neutral"
    };
    
    let analysis = EmotionAnalysis {
        emotion: emotion.to_string(),
        confidence: 0.8,
        intensity: 0.7,
    };
    Ok(analysis)
}

#[tauri::command]
async fn get_system_info() -> Result<serde_json::Value, String> {
    let info = serde_json::json!({
        "platform": std::env::consts::OS,
        "architecture": std::env::consts::ARCH,
        "memory_available": {
            "total": 8589934592u64,
            "available": 4294967296u64,
            "percent_used": 50u32
        },
        "llm_models": vec![
            "phi-3.5-mini",
            "emotion-analyzer",
            "speech-recognition"
        ]
    });
    Ok(info)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            generate_response,
            analyze_emotion,
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
