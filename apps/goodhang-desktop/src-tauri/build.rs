fn main() {
    // Set API URL based on build profile
    // This env var is read by commands/activation.rs and commands/user_status.rs
    let profile = std::env::var("PROFILE").unwrap_or_default();
    if profile == "release" {
        // Production URL for release builds
        println!("cargo:rustc-env=GOODHANG_API_URL=https://api.goodhang.com");
    }
    // Debug builds fall back to staging URL in the Rust code

    tauri_build::build()
}
