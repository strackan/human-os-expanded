fn main() {
    // Set production API URL for release builds
    // This env var is read by activation.rs::get_api_base_url()
    let profile = std::env::var("PROFILE").unwrap_or_default();
    if profile == "release" {
        println!("cargo:rustc-env=GOODHANG_API_URL=https://goodhang-staging.vercel.app");
    }

    tauri_build::build()
}
