# J.A.R.V.I.S. — Personal AI Agent HUD

> **Just A Rather Very Intelligent System**  
> An interactive Sci-Fi HUD, Holographic Arc Reactor visualizer, speech recognition & voice synthesis agent built with modern Web APIs, procedural Web Audio sound synthesis, real-time location atmospheric weather, real hardware telemetry, and frontier LLM intelligence for **Harsh**.

---

## ⚡ Features Overview

- **Interactive Holographic Arc Reactor Visualizer**:
  - Procedural Canvas multi-ring geometry rotating with segmented coils, mechanical dials, and orbital particle physics.
  - Dynamically responds to agent states: `STANDBY`, `LISTENING`, `PROCESSING`, and `VOCAL FEED`.
  - Oscilloscope audio waveform synchronized with speech synthesis and voice capture.
  - Direct touch/click to engage voice recognition.

- **Real-Time Voice & Audio Intelligence**:
  - **Speech-to-Text (`SpeechRecognition`)**: Speak naturally to Jarvis using your microphone.
  - **Speech Synthesis (`SpeechSynthesis`)**: Refined British vocal synthesis matching the classic Jarvis persona (with adjustable pitch & speed).
  - **Procedural Sound Engine (`Web Audio API`)**: Generates authentic UI chimes, power sweeps, alerts, and clicks entirely in-browser without external audio assets.

- **Multi-Step Autonomous Workflow Engine Across Apps**:
  - **Cross-App Tool Execution**: Automatically executes actions across browser capabilities and web services:
    - `search_knowledge`: Real-time topic research via live Wikipedia API queries.
    - `live_weather`: Queries live Open-Meteo atmospheric sensors for detected or specified cities.
    - `task_directives`: Dynamically manages, adds, and prioritizes mission tasks.
    - `scratchpad_notes`: Formats and appends findings to the tactical scratchpad.
    - `email_draft`: Prepares email drafts, copies to clipboard, and triggers native mail clients via `mailto:`.
    - `calendar_event`: Generates standard `.ics` (iCalendar RFC 5545) event files and triggers instant schedule download.
    - `file_export`: Generates and exports downloadable Markdown (`.md`) or text reports.
    - `system_notification`: Dispatches native desktop and mobile push notifications.
    - `web_share`: Native Web Share integration to send findings directly to WhatsApp, Slack, Notes, or Gmail.
  - **Dynamic Planner & Decomposer**: Automatically deconstructs natural language goals (e.g. *"Plan my day with morning briefing and calendar event"*, *"Research AI agents and draft summary email"*) into ordered steps with parameter validation.

- **Failure Recognition & Auto-Healing Pipeline**:
  - **Taxonomy Failure Detection**: Recognizes timeouts (12s abort limit), HTTP 4xx/5xx errors, browser permission blocks, and network offline conditions.
  - **Self-Healing Fallbacks**: Automatically engages fallback strategies (e.g., cached weather on geocoding error, scratchpad draft if email popup blocked, visual HUD alert if push notification denied).
  - **Step Recovery UI**: If retries are exhausted, displays interactive **RETRY** and **SKIP** controls in the HUD with audio alerts.

- **Smooth Device Apps Opener & Native Launcher**:
  - Directly launches and controls applications on your computer and mobile device:
    - **WhatsApp**: Smoothly launches WhatsApp desktop/web with prefilled messages and contacts (`whatsapp://send?text=...`).
    - **Notepad**: Opens a dedicated Desktop Notepad HUD workspace with word/line counts, `.txt` file downloads, and compatibility with native Windows Notepad.
    - **Calculator**: Directly opens the native Windows Calculator app (`ms-calculator:`) with on-the-fly math calculation.
    - **VS Code**: Launches Visual Studio Code (`vscode://`) on your device.
    - **Spotify**: Opens Spotify desktop or web player with search queries (`spotify:search:...`).
    - **YouTube & Google Maps**: Launches video and location viewports instantly.
    - **Windows Settings, Paint & Clock**: Launches native Windows system utilities (`ms-settings:`, `ms-paint:`, `ms-clock:`).

- **Works Across Devices (Mobile, Tablet, Desktop)**:
  - **PWA (Progressive Web App)**: Installable as a native standalone app on Android, iOS (Safari Add to Home Screen), Windows, and macOS.
  - **Service Worker (`sw.js`)**: Caches core assets for instant loading and offline resilience.
  - **Mobile Thumb Navigation**: Adaptive bottom HUD navigation bar on screen widths `< 820px` to switch between Telemetry, Jarvis Core, and Directives.
  - **Cross-Device State Sync**: One-click JSON workspace backup/restore, plus instant QR/URL sync link generation.

- **Autonomous Agent Skills & Intent Engine**:
  - **Real Atmospheric Location & Weather**: Dynamically detects the user's real geographic location via IP geolocation / HTML5 geolocation and fetches live real-time conditions (temperature, feels-like, humidity, wind speed) from Open-Meteo.
  - **Real Hardware Telemetry**: Monitors actual logical CPU cores (`navigator.hardwareConcurrency`), real round-trip network ping latency, real battery status or desktop AC power (`navigator.getBattery()`), and operating system platform.
  - **Personal Mission Directives (Tasks)**: Add, complete, and track directives with persistent `localStorage`.
  - **Tactical Scratchpad**: Notes stream with automatic timestamping.
  - **System Modes & Protocols**: Instant triggers for *Focus Mode*, *Night Mode*, *Diagnostics*, and *Voice Mode*.
  - **Armor Theme Matrix**: Real-time theme switching between Mark IV (Cyan), Mark VII (Gold & Crimson), Stealth Emerald, and Quantum Violet.

- **Groq & OpenAI Frontier LLM Core for Prompts**:
  - **Groq Cloud Integration**: Ultra-fast LPU inference via OpenAI-compatible endpoints (`https://api.groq.com/openai/v1/chat/completions`) using `openai/gpt-oss-120b` (Default) or `mixtral-8x7b-32768`.
  - **OpenAI Official Models**: Take prompts with `gpt-4o-mini`, `gpt-4o`, or `gpt-3.5-turbo`.
  - **Multi-Turn Contextual Memory**: Jarvis remembers prior conversation turns and injects live HUD telemetry (power, tasks, date/time) directly into prompt reasoning.
  - **Auto-Detection**: Pasting a `gsk_...` key automatically selects Groq, while `sk-...` selects OpenAI.

---

## 🚀 Getting Started

### 1. Launching Locally
The server is currently running on port `9000`:
```bash
# Open in your browser
http://localhost:9000
```

Alternatively, you can open [index.html](file:///d:/Shark-Techs-collab/index.html) directly in any modern web browser (Google Chrome, Microsoft Edge, Brave, or Safari).

### 2. Voice Commands Cheatsheet
You can click the **Arc Reactor** or the **Microphone** button and speak any of the following:

| Voice Command | Action / Response |
| :--- | :--- |
| *"What's the weather?"* | Fetches live temperature and conditions for your detected city |
| *"System status"* | Runs real diagnostics on CPU cores, latency, battery, and uptime |
| *"Add task: [directive]"* | Stores a new directive into active mission objectives |
| *"Show directives"* | Summarizes pending objectives |
| *"Save note: [notes]"* | Appends timestamped note to the scratchpad |
| *"Activate protocol [focus/night/diagnostic/voice]"* | Engages system mode sweeps and visual cues |
| *"Switch theme to [gold/cyan/emerald/violet]"* | Recalibrates HUD armor color matrix |
| *"Calculate [math expression]"* | Solves arithmetic computations on the fly |
| *"Search Google for [query]"* | Launches web search in a new tab |
| *"Who are you?"* / *"Tell me a joke"* | AI persona and programming humor |

---

## 📁 File Structure

```
Shark-Techs-collab/
├── index.html            # Main Stark HUD semantic layout & modal containers
├── styles.css            # Sci-Fi Glassmorphism, neon styling & theme matrices
├── README.md             # Documentation & instructions
└── js/
    ├── sound.js          # Procedural Web Audio API sound synthesis
    ├── visualizer.js     # Canvas Arc Reactor multi-ring & waveform animations
    ├── speech.js         # Web Speech API recognition & vocal synthesis
    ├── agent.js          # Jarvis NLP cognitive intent parser & LLM bridge
    └── app.js            # Main application controller & telemetry monitors
```
