# J.A.R.V.I.S. — Personal AI Agent & Stark Industries HUD

> **Just A Rather Very Intelligent System**  
> An interactive Iron Man HUD, Holographic Arc Reactor visualizer, speech recognition & voice synthesis agent built with modern Web APIs, procedural Web Audio sound synthesis, and autonomous task intelligence.

---

## ⚡ Features Overview

- **Interactive Holographic Arc Reactor Visualizer**:
  - Procedural Canvas multi-ring geometry rotating with segmented coils, mechanical dials, and orbital particle physics.
  - Dynamically responds to agent states: `STANDBY`, `LISTENING`, `PROCESSING`, and `VOCAL FEED`.
  - Oscilloscope audio waveform synchronized with speech synthesis and voice capture.
  - Direct touch/click to engage voice recognition.

- **Real-Time Voice & Audio Intelligence**:
  - **Speech-to-Text (`SpeechRecognition`)**: Speak naturally to Jarvis using your microphone.
  - **Speech Synthesis (`SpeechSynthesis`)**: Refined British vocal synthesis matching the classic Marvel Jarvis persona (with adjustable pitch & speed).
  - **Procedural Sound Engine (`Web Audio API`)**: Generates authentic Stark UI chimes, power sweeps, alerts, and clicks entirely in-browser without external audio assets.

- **Autonomous Agent Skills & Intent Engine**:
  - **Atmospheric Sensors & Real Geolocation**: Real IP geolocation via GeoJS detects city and region, querying live weather (actual temperature, feels-like, weather condition codes, and icons) via Open-Meteo.
  - **System Telemetry & Hardware Scan**: Monitors live battery percentage & charging status, real CPU cores, memory concurrency, ping latency, and system uptime.
  - **Mission Directives (Tasks)**: Add, complete, and track directives with persistent `localStorage`.
  - **Tactical Scratchpad**: Notes stream with automatic timestamping.
  - **System Modes & Protocols**: Instant triggers for *Focus Mode*, *Night/Stealth Mode*, *Diagnostics*, and *Voice Loop*.
  - **Armor Theme Matrix**: Real-time theme switching between Mark IV (Cyan), Mark VII (Gold & Crimson), Stealth Emerald, and Quantum Violet.
  - **Groq & OpenAI Frontier LLM Core**: Ultra-fast LPU inference via OpenAI-compatible Groq endpoints using `openai/gpt-oss-120b` (Default) or OpenAI models.
  - **Multi-Turn Contextual Memory**: Jarvis remembers prior conversation turns and injects live HUD telemetry (power, tasks, date/time) directly into prompt reasoning.
  - **Auto-Detection**: Pasting a `gsk_...` key automatically selects Groq, while `sk-...` selects OpenAI.

---

## 🚀 Getting Started

### 1. Launching Locally
The server runs on port `9000`:
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
| *"What's the weather?"* | Fetches live temperature, feels-like, and condition for your detected city |
| *"System status"* | Runs real diagnostics on CPU cores, latency, battery, and uptime |
| *"Add task: [directive]"* | Stores a new directive into active mission objectives |
| *"Show directives"* | Summarizes pending objectives |
| *"Save note: [notes]"* | Appends timestamped note to the tactical scratchpad |
| *"Activate protocol [focus/night/diagnostic/voice]"* | Engages system mode sweeps and visual cues |
| *"Switch theme to [gold/cyan/emerald/violet]"* | Recalibrates HUD armor color matrix |
| *"Calculate [math expression]"* | Solves arithmetic computations on the fly |
| *"Search Google for [query]"* | Launches web search in a new tab |
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



