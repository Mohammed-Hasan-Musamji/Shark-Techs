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
  - **Real Atmospheric Location & Weather**: Dynamically detects the user's real geographic location via IP geolocation and fetches live real-time conditions (temperature, feels-like, humidity, wind speed) from Open-Meteo.
  - **Real Hardware Telemetry**: Monitors actual logical CPU cores, real round-trip network ping latency, real battery status or desktop AC power, and operating system platform.
  - **Personal Mission Directives (Tasks)**: Add, complete, and track directives with persistent `localStorage`.
  - **Tactical Scratchpad**: Notes stream with automatic timestamping.
  - **System Modes & Protocols**: Instant triggers for *Focus Mode*, *Night/Stealth Mode*, *Diagnostics*, and *Voice Loop*.
  - **Armor Theme Matrix**: Real-time theme switching between Mark IV (Cyan), Mark VII (Gold & Crimson), Stealth Emerald, and Quantum Violet.

- **Groq & OpenAI Frontier LLM Core for Prompts**:
  - **Groq Cloud Integration**: Ultra-fast LPU inference via OpenAI-compatible endpoints using `openai/gpt-oss-120b` (Default) or `llama-3.3-70b-versatile`.
  - **OpenAI Official Models**: Take prompts with `gpt-4o-mini`, `gpt-4o`, or `gpt-3.5-turbo`.
  - **Multi-Turn Contextual Memory**: Jarvis remembers prior conversation turns and injects live HUD telemetry (power, tasks, date/time) directly into prompt reasoning.
  - **Auto-Detection**: Pasting a `gsk_...` key automatically selects Groq, while `sk-...` selects OpenAI.

---

## 🚀 Getting Started

### 1. Launching Locally
The zero-dependency host bridge server runs on port `9000`:
```bash
# Start the bridge server
node server.js

# Open in your browser
http://localhost:9000
```

Alternatively, open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Brave, or Safari).

### 2. Voice Commands Cheatsheet
You can click the **Arc Reactor** or the **Microphone** button and speak any of the following:

| Voice Command | Action / Response |
| :--- | :--- |
| *"Open WhatsApp and message Hasan hi"* | Opens WhatsApp with recipient Hasan and message "hi" prefilled |
| *"Open Notepad and write [something]"* | Launches Desktop Notepad and writes/saves your text note |
| *"Open Calculator"* / *"Calculate [expression]"* | Launches Windows Calculator & solves arithmetic computations |
| *"Open Spotify"* / *"Play lo-fi music"* | Launches Spotify desktop / web player |
| *"Search YouTube for [query]"* | Dispatches search query to YouTube in foreground |
| *"What's the weather?"* | Fetches live temperature, feels-like, and condition for your detected city |
| *"System status"* | Runs real diagnostics on CPU cores, latency, battery, and uptime |
| *"Add task: [directive]"* | Stores a new directive into active mission objectives |
| *"Show directives"* | Summarizes pending objectives |
| *"Save note: [notes]"* | Appends timestamped note to the tactical scratchpad |
| *"Plan my day"* / *"Workflow: [goal]"* | Executes multi-step autonomous cross-app workflow |
| *"Activate protocol [focus/night/diagnostic/voice]"* | Engages system mode sweeps and visual cues |
| *"Switch theme to [gold/cyan/emerald/violet]"* | Recalibrates HUD armor color matrix |
| *"Search Google for [query]"* | Launches web search in host browser |
| *"Who are you?"* / *"Tell me a joke"* | AI persona and programming humor |

---

## 📁 MVC Architecture File Structure

```
Shark-Techs/
├── index.html                    # Main Stark HUD semantic layout & modal containers
├── styles.css                    # Sci-Fi Glassmorphism, neon styling & theme matrices
├── .env                          # Environment secrets (Groq API Key, Default Provider & Model)
├── env.js                        # Client environment injector
├── README.md                     # Documentation & cheatsheets
└── js/
    ├── app.js                    # Application bootstrapper
    ├── models/                   # Model Layer (State, Persistence & APIs)
    │   ├── ConfigModel.js        # API credentials, provider configurations, preferences
    │   ├── DirectiveModel.js     # Mission directives (tasks) & tactical scratchpad storage
    │   ├── TelemetryModel.js     # Live sensors (Battery, Network, Weather API, Diagnostics)
    │   ├── ConversationModel.js  # Holographic feed & multi-turn contextual memory buffer
    │   ├── SystemBridgeModel.js  # Computer OS controls, bridge APIs & mobile telemetry
    │   └── AgentModel.js         # Cognitive intent engine, Groq LPU & autonomous action caller
    ├── views/                    # View Layer (DOM Presentation, Canvas & Web APIs)
    │   ├── AudioView.js          # Procedural Web Audio API sound synthesis (clicks, sirens, pings)
    │   ├── VisualizerView.js     # Canvas Arc Reactor multi-ring & audio waveform render loop
    │   ├── SpeechView.js         # Web Speech recognition & authentic British voice synthesis
    │   ├── HudView.js            # Header telemetry, digital clock, uptime, armor theme matrix
    │   ├── TelemetryView.js      # Real CPU/RAM gauges, network monitor, weather card, logs
    │   ├── ConversationView.js   # Transmission feed rendering & auto-scroll
    │   ├── DirectiveView.js      # Mission directives interactive checklist & scratchpad
    │   ├── SettingsModalView.js  # Settings modal controls, model selectors, API key inputs
    │   └── MobileConnectView.js  # Mobile QR uplink, device detector, remote triggers & screenshots
    └── controllers/              # Controller Layer (Event Dispatch & Coordination)
        ├── DirectiveController.js# Task form, directive toggles, deletions & note saves
        ├── TelemetryController.js# Sensor timers, protocols, theme buttons & weather queries
        ├── SettingsController.js # Settings modal lifecycle, model switches & credentials
        ├── AgentController.js    # Voice/text command intake, LLM dispatch & vocal delivery
        └── AppController.js      # Master MVC orchestrator & lifecycle initializer
```

---

## 📱 Connecting From Your Mobile Phone

1. **Ensure your phone is on the same Wi-Fi network** as your computer.
2. In the JARVIS HUD header, click the **📱 CONNECT PHONE** button.
3. **Scan the holographic QR Code** with your phone's camera app, or enter the network link in your mobile browser:
   ```
   http://192.168.143.209:9000
   ```
4. Once connected, your phone functions as a **remote handheld JARVIS satellite controller**. You can tap the microphone or Arc Reactor on your phone and speak commands to control your computer.
5. **Away from home?** Click **ENGAGE REMOTE CELLULAR TUNNEL** to generate a secure public HTTPS link accessible from cellular data anywhere in the world.

---

## 🖥️ Computer Control Voice & Text Commands

You can speak or type any of the following to command your PC:

| Command | Action on Your Computer |
| :--- | :--- |
| *"Open Spotify"* / *"Play Spotify"* | Launches Spotify application on host console |
| *"Open Notepad"* / *"Open notes"* | Launches Windows Notepad on screen |
| *"Open Notepad and write [text]"* | Writes text into document and opens Notepad with content rendered |
| *"Search [query] on Google"* | Opens browser and performs Google search for query |
| *"Search YouTube for [topic]"* | Opens YouTube with video search results |
| *"Search Wikipedia for [topic]"* | Queries Wikipedia knowledge base & opens article |
| *"Open WhatsApp and message to [name] [text]"* | Opens WhatsApp Web and copies message to clipboard |
| *"Open Calculator"* | Deploys Windows Calculator unit |
| *"Open Chrome"* / *"Open browser"* | Launches Google Chrome |
| *"Open YouTube"* / *"Open GitHub"* | Navigates host browser to the destination |
| *"Open VS Code"* / *"Open code"* | Opens Visual Studio Code editor |
| *"Open files"* / *"Open explorer"* | Launches Windows File Explorer |
| *"Open Task Manager"* | Opens Windows Task Manager |
| *"Take a screenshot"* / *"Capture screen"* | Captures primary display and streams preview to phone/PC |
| *"Mute PC"* / *"Unmute PC"* | Toggles host audio mute |
| *"Volume up"* / *"Volume down"* | Adjusts computer master volume |
| *"Lock computer"* / *"Lock screen"* | Locks Windows workstation instantly |
| *"What is my CPU and RAM?"* | Reports real host CPU load and memory usage |
| *"Run command: [powershell command]"* | Executes command on host and returns output |

---

## 🖥️ Running as Native Desktop Application

J.A.R.V.I.S. can now run as a **dedicated native Windows desktop application** with full window management, Alt+Space hotkey toggle, and direct OS control:

```bash
# 1. Start the desktop application
npm run desktop

# OR on Windows, simply double-click:
jarvis-desktop.bat
```

### 💾 MongoDB Dialogue History
- All conversations are automatically saved in local MongoDB (`mongodb://127.0.0.1:27017/jarvis_hud`).
- Fallback to resilient disk cache (`data/history.json`) if MongoDB service is stopped.
- Click **EXPORT CHAT** in the HUD header to download the complete transcript as Markdown or JSON anytime.



