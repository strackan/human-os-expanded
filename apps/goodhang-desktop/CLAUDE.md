# GoodHang Desktop

Desktop application for the GoodHang platform built with Tauri and Vite.

## Tech Stack
- Vite + Tauri 2 (Rust backend)
- React 19, TypeScript 5
- Tailwind CSS 3.4
- TanStack Query 5.60, Zustand (state management)

## PM2
- **Name:** `goodhang:goodhang-desktop`
- **Dev port:** 4102 (Vite dev server only — Tauri shell launched separately)
- **Start:** `pm2 start ecosystem.config.js --only goodhang:goodhang-desktop`

## Notes
- PM2 manages only the Vite dev server on port 4102
- To launch the full Tauri desktop app, run `cargo tauri dev` separately
- The Vite server is also used for web preview

## Commands
```bash
pm2 start ecosystem.config.js --only goodhang:goodhang-desktop  # Vite dev server (port 4102)
cargo tauri dev    # Full desktop app (launches Vite + Tauri)
```
