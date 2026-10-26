// SPDX-License-Identifier: GPL-3.0-or-later
// Aetherium — Generative Ambient Soundscape & Receptive Music Therapy Sanctuary
// Copyright (C) 2026 Voidwave Lab
// SPDX-License-Identifier: GPL-3.0-or-later
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct ConstellationFilePayload {
    pub version: String,
    pub name: String,
    pub saved_at: String,
    pub mode: String,
    pub active_seed_id: String,
    pub macro_params: MacroParamsPayload,
    pub core_offset: CoreOffsetPayload,
    pub satellites: Vec<SatelliteNodePayload>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub practitioner_config: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MacroParamsPayload {
    pub luminance: f64,
    pub fog: f64,
    pub viscosity: f64,
    pub nostalgia: f64,
    pub rarity: f64,
    #[serde(default)]
    pub serendipity: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoreOffsetPayload {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SatelliteNodePayload {
    pub id: String,
    pub semi_major_axis: f64,
    pub eccentricity: f64,
    pub angle: f64,
    pub argument_of_periapsis: f64,
    pub octave: u8,
    pub scale_degree: usize,
}

/// Resolves the local user presets directory inside the OS AppData folder and ensures it exists.
fn resolve_presets_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Unable to resolve application data directory".to_string())?;
    let presets_dir = base_dir.join("constellations");
    if !presets_dir.exists() {
        fs::create_dir_all(&presets_dir)
            .map_err(|err| format!("Failed to create constellations directory: {}", err))?;
    }
    Ok(presets_dir)
}

#[tauri::command]
fn save_constellation_json(
    app_handle: tauri::AppHandle,
    file_path: Option<String>,
    payload_json: String,
) -> Result<String, String> {
    let parsed: ConstellationFilePayload = serde_json::from_str(&payload_json)
        .map_err(|err| format!("Invalid constellation JSON schema: {}", err))?;

    let target_path = match file_path {
        Some(custom) if !custom.trim().is_empty() => PathBuf::from(custom),
        _ => {
            let dir = resolve_presets_dir(&app_handle)?;
            let safe_name: String = parsed
                .name
                .chars()
                .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
                .collect();
            dir.join(format!("{}.aether.json", safe_name.to_lowercase()))
        }
    };

    let pretty_json = serde_json::to_string_pretty(&parsed)
        .map_err(|err| format!("Failed to serialize constellation JSON: {}", err))?;

    fs::write(&target_path, pretty_json)
        .map_err(|err| format!("Failed to write constellation file: {}", err))?;

    Ok(target_path.to_string_lossy().into_owned())
}

#[tauri::command]
fn load_constellation_json(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("Constellation file not found at {}", file_path));
    }
    let content = fs::read_to_string(&path)
        .map_err(|err| format!("Failed to read constellation file: {}", err))?;

    let _validated: ConstellationFilePayload = serde_json::from_str(&content)
        .map_err(|err| format!("Corrupted or incompatible constellation JSON: {}", err))?;

    Ok(content)
}

#[tauri::command]
fn save_audio_binary_file(file_path: String, bytes: Vec<u8>) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|err| format!("Failed to create parent directory: {}", err))?;
        }
    }
    fs::write(&path, &bytes)
        .map_err(|err| format!("Failed to write audio file to {}: {}", file_path, err))?;
    Ok(path.to_string_lossy().into_owned())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_window("main") {
                let _ = window.set_title("Aetherium — Generative Soundscape & Receptive Therapy");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_constellation_json,
            load_constellation_json,
            save_audio_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aetherium Tauri application");
}
