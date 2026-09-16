# SafetyLink Admin Portal (Windows Executable)

This directory contains the cleanly generated, isolated blueprint for compiling a lightweight Windows desktop admin client using Tauri (Option B) for the existing multi-tenant security ecosystem.

## Tech Stack Constraints:
- **Frontend**: Vanilla JavaScript / HTML communicating with a shared backend.
- **Backend/Database Source of Truth**: Supabase (shared with the existing mobile APK ecosystem).
- **Target**: Windows Executable (.exe) via Tauri CLI build tooling.

## Core Functional Requirements Implemented:
1. **Login Screen**: A clean window interface where a security company administrator inputs their unique "Organization ID" and password.
2. **Authentication & Data Fetching**: Queries the Supabase `organizations` table to validate credentials, then fetches all records from the `users` (community members) table matching that specific `org_id`.
3. **Dashboard View**: Renders a structured data table showing the list of registered users under that specific organization, updating in real-time or via manual refresh.

## Building the Windows EXE Locally via Terminal

To avoid relying on buggy cloud IDE environments crashing your repo commits, run these commands locally inside a clean directory structure (on a machine with the Rust toolchain installed):

1. **Install Tauri CLI dependencies:**
   ```bash
   npm install --save-dev @tauri-apps/cli
   ```

2. **Initialize Tauri structure if not already present:**
   *(Note: The core configuration `tauri.conf.json` is already provided in `src-tauri/`)*
   ```bash
   npx tauri init
   ```

3. **Compile the production Windows executable binary (.exe):**
   ```bash
   npx tauri build
   ```

This generates your standalone `.exe` installer inside `src-tauri/target/release/bundle/nsis/` without polluting your core project commits.
