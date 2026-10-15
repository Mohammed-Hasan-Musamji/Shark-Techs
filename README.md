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
  - **Atmospheric Sensors**: Queries live weather parameters (temperature, humidity, wind speed) via the Open-Meteo satellite API.
  - **System Telemetry & Hardware Scan**: Monitors live battery percentage & charging status (`navigator.getBattery()`), network uplink speed, and uptime.
  - **Mission Directives (Tasks)**: Add, complete, and track personal directives with persistent `localStorage`.
  - **Tactical Scratchpad**: Encrypted notes stream with automatic timestamping.
  - **Defense Protocols**: Instant triggers for *House Party*, *Stealth Mode*, *Diagnostics*, and *Red Alert*.
  - **Armor Theme Matrix**: Real-time theme switching between Mark IV (Stark Cyan), Mark VII (Gold & Crimson), Stealth Emerald, and Quantum Violet.
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
| *"What's the weather?"* | Fetches live temperature, humidity, and flight conditions |
| *"System status"* | Runs diagnostics on battery, network, resolution, and uptime |
| *"Add task: [directive]"* | Stores a new directive into active mission objectives |
| *"Show directives"* | Summarizes pending objectives |
| *"Save note: [classified data]"* | Appends timestamped note to the tactical scratchpad |
| *"Activate protocol [house party/stealth/red alert]"* | Triggers defensive audio sweeps and visual alerts |
| *"Switch theme to [gold/cyan/emerald/violet]"* | Recalibrates HUD armor color matrix |
| *"Calculate [math expression]"* | Solves arithmetic computations on the fly |
| *"Search Google for [query]"* | Launches satellite uplink web search in a new tab |
| *"Who are you?"* / *"Tell me a joke"* | Stark Industries AI lore and humor |

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
