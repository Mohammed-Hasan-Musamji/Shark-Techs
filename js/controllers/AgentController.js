/**
 * ============================================================================
 * J.A.R.V.I.S. AGENT CONTROLLER (C - MVC)
 * Orchestrates user voice/text commands, cognitive processing & vocal delivery
 * ============================================================================
 */

class AgentController {
    constructor(agentModel, conversationModel, conversationView, visualizerView, speechView, audioView, telemetryModel, directiveModel, configModel, systemBridgeModel) {
        this.agent = agentModel;
        this.conversation = conversationModel;
        this.conversationView = conversationView;
        this.visualizer = visualizerView;
        this.speech = speechView;
        this.audio = audioView;
        this.telemetry = telemetryModel;
        this.directives = directiveModel;
        this.config = configModel;
        this.systemBridge = systemBridgeModel;

        this.init();
    }

    init() {
        this.setupCommandInputListeners();
        this.setupVoiceListeners();
    }

    setupCommandInputListeners() {
        const cmdInput = document.getElementById('commandInput');
        const btnSubmit = document.getElementById('btnSubmitCommand');

        const submitAction = () => {
            const val = cmdInput ? cmdInput.value.trim() : '';
            if (val) {
                this.executeCommand(val);
                if (cmdInput) cmdInput.value = '';
            }
        };

        if (btnSubmit) {
            btnSubmit.addEventListener('click', submitAction);
        }

        if (cmdInput) {
            cmdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitAction();
                }
            });
        }
    }

    setupVoiceListeners() {
        // Toggle listening on Arc Reactor canvas click
        const reactorTrigger = document.getElementById('reactorTrigger');
        if (reactorTrigger) {
            reactorTrigger.addEventListener('click', () => {
                this.speech.toggleListening();
            });
        }

        // Toggle listening on Microphone button click
        const btnVoiceToggle = document.getElementById('btnVoiceToggle');
        if (btnVoiceToggle) {
            btnVoiceToggle.addEventListener('click', () => {
                this.speech.toggleListening();
            });
        }

        // Toggle speech recognition language (EN / 中文)
        const btnLangToggle = document.getElementById('btnLangToggle');
        if (btnLangToggle) {
            btnLangToggle.addEventListener('click', () => {
                const newLang = this.speech.toggleLanguage();
                this.audio.playClick();
                this.telemetry.appendLog(`[SYSTEM] Voice recognition language switched to: ${newLang}`);
            });
        }

        // Hook into SpeechView state changes
        this.speech.onListeningChange = (isListening) => {
            if (isListening) {
                this.visualizer.setState('listening');
                this.audio.playWakePing();
            } else {
                if (this.visualizer.state === 'listening') {
                    this.visualizer.setState('standby');
                }
            }
        };

        // Hook into SpeechView recognition transcription result
        this.speech.onSpeechResult = (transcript) => {
            this.executeCommand(transcript);
        };
    }

    async executeCommand(rawInput) {
        const input = rawInput.trim();
        if (!input) return;

        // 1. Append user prompt to conversation stream
        this.conversation.addMessage('user', input);

        // 2. Audio & Visualizer feedback
        this.audio.playClick();
        this.visualizer.setState('processing');

        // 3. Check for direct local action (Theme, Tasks, Weather, Protocols, etc.)
        const direct = this.agent.checkDirectAction(input);
        if (direct) {
            await this.handleDirectAction(direct, input);
            return;
        }

        // 4. If an LLM provider is active, query LLM (Groq / OpenAI / Gemini)
        const activeKey = this.config.getApiKey();
        if (activeKey && this.config.provider !== 'builtin') {
            try {
                this.telemetry.appendLog(`[LLM] Routing prompt to ${this.config.provider.toUpperCase()} (${this.config.getActiveModel()})...`);
                const response = await this.agent.queryLLM(input);
                this.deliverResponse(response);
                return;
            } catch (err) {
                console.warn('Frontier LLM Query Error:', err);
                this.telemetry.appendLog(`[ERR] ${this.config.provider.toUpperCase()}: ${err.message}`);
                const friendlyError = this.agent.formatErrorMessage(err);
                this.deliverResponse(friendlyError, true);
                return;
            }
        }

        // 5. Offline heuristics fallback
        const offlineReply = this.agent.queryOfflineEngine(input);
        this.deliverResponse(offlineReply);
    }

    async handleDirectAction(direct, rawInput) {
        if (direct.action === 'theme') {
            this.config.setTheme(direct.theme);
            this.telemetry.appendLog(`[ARMOR] ${direct.theme.toUpperCase()} matrix calibrated.`);
            this.deliverResponse(direct.message);
        } else if (direct.action === 'protocol') {
            this.telemetry.setProtocol(direct.protocol);
            if (direct.protocol === 'red-alert') {
                this.audio.playAlert();
            } else {
                this.audio.playProtocolEngaged();
            }
            this.deliverResponse(direct.message);
        } else if (direct.action === 'weather') {
            const w = await this.telemetry.fetchLiveWeather();
            const reply = `Real-time weather for ${w.city}: Currently ${w.tempC}°C, feels like ${w.feelsLike || w.tempC}°C with ${(w.condition || 'clear skies').toLowerCase()}. Humidity is ${w.humidity} and wind speed is ${w.windSpeed}, ${this.config.userName}.`;
            this.deliverResponse(reply);
        } else if (direct.action === 'add_task') {
            this.directives.addTask(direct.text);
            this.deliverResponse(direct.message);
        } else if (direct.action === 'clear_tasks') {
            this.directives.clearTasks();
            this.deliverResponse(direct.message);
        } else if (direct.action === 'save_note') {
            this.directives.appendNote(direct.text);
            this.deliverResponse(direct.message);
        } else if (direct.action === 'clear_chat') {
            this.conversation.clear();
            this.audio.playProcessComplete();
        } else if (direct.action === 'bridge_search') {
            this.deliverResponse(direct.message);
            try { window.open(direct.url, '_blank'); } catch (e) {}
            if (this.systemBridge) {
                await this.systemBridge.searchWeb(direct.query, direct.engine, direct.url);
                this.telemetry.appendLog(`[SEARCH] Query "${direct.query}" dispatched via ${direct.engine.toUpperCase()}`);
            }
            if (window.jarvisWorkflow && (direct.engine === 'google' || direct.engine === 'wikipedia')) {
                window.jarvisWorkflow.toolSearchKnowledge({ query: direct.query }).then(res => {
                    if (res && res.snippet) {
                        this.conversation.addMessage('jarvis', `**Quick Intel (${res.title})**: ${res.snippet}`);
                    }
                }).catch(() => {});
            }
        } else if (direct.action === 'bridge_notepad_write') {
            this.deliverResponse(direct.message);
            if (this.directives) {
                this.directives.appendNote(`[Dictated] ${direct.text}`);
            }
            // Populate in-HUD Notepad if present
            const hudNotepadArea = document.getElementById('desktopNotepadTextarea');
            if (hudNotepadArea) {
                hudNotepadArea.value = (hudNotepadArea.value ? hudNotepadArea.value + '\n\n' : '') + direct.text;
                if (window.jarvisDevice && typeof window.jarvisDevice.updateNotepadStats === 'function') {
                    window.jarvisDevice.updateNotepadStats();
                }
            }
            if (this.systemBridge) {
                const res = await this.systemBridge.openAppWithText('notepad', direct.text);
                if (res && res.success) {
                    this.telemetry.appendLog(`[NOTEPAD] Note dictated and opened in Windows Notepad.`);
                }
            }
        } else if (direct.action === 'bridge_whatsapp_msg') {
            this.deliverResponse(direct.message);
            if (direct.text && navigator.clipboard) {
                navigator.clipboard.writeText(direct.text).catch(() => {});
            }
            try { window.open(direct.url, '_blank'); } catch (e) {}
            if (this.systemBridge) {
                await this.systemBridge.openUrl(direct.url);
                this.telemetry.appendLog(`[WHATSAPP] Web opened for ${direct.contact}. Message copied to clipboard.`);
            }
        } else if (direct.action === 'bridge_app') {
            this.deliverResponse(direct.message);
            if (this.systemBridge) {
                const res = await this.systemBridge.openApp(direct.app);
                if (res && res.success) {
                    this.telemetry.appendLog(`[APP] Launched ${direct.app} on host system.`);
                } else {
                    this.telemetry.appendLog(`[WARN] Host bridge launch: ${res?.error || 'Make sure server.js is running on port 9000'}`);
                }
            }
        } else if (direct.action === 'bridge_url') {
            this.deliverResponse(direct.message);
            try { window.open(direct.url, '_blank'); } catch (e) {}
            if (this.systemBridge) {
                await this.systemBridge.openUrl(direct.url);
                this.telemetry.appendLog(`[NAV] Navigated to ${direct.url}`);
            }
        } else if (direct.action === 'bridge_volume') {
            this.deliverResponse(direct.message);
            if (this.systemBridge) await this.systemBridge.controlVolume(direct.volumeAction);
        } else if (direct.action === 'bridge_screenshot') {
            this.deliverResponse(direct.message);
            if (this.systemBridge) await this.systemBridge.captureScreenshot();
        } else if (direct.action === 'bridge_lock') {
            this.deliverResponse(direct.message);
            if (this.systemBridge) await this.systemBridge.lockWorkstation();
        } else if (direct.action === 'bridge_exec') {
            this.deliverResponse(direct.message);
            if (this.systemBridge) {
                const res = await this.systemBridge.executeTerminal(direct.command);
                if (res.stdout) {
                    this.conversation.addMessage('jarvis', `Output:\n\`\`\`powershell\n${res.stdout.substring(0, 400)}\n\`\`\``);
                } else if (res.stderr) {
                    this.conversation.addMessage('jarvis', `Error:\n\`\`\`\n${res.stderr}\n\`\`\``, true);
                }
            }
        } else if (direct.action === 'status') {
            this.deliverResponse(direct.message);
        } else if (direct.action === 'response') {
            this.deliverResponse(direct.message);
        }
    }

    deliverResponse(text, isError = false) {
        this.audio.playProcessComplete();
        this.conversation.addMessage('jarvis', text, isError);

        // Vocal synthesis with visualizer synchronization
        this.speech.speak(
            text,
            () => {
                this.visualizer.setState('speaking');
            },
            () => {
                this.visualizer.setState('standby');
            }
        );
    }
}
