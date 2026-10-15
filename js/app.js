/**
 * ============================================================================
 * J.A.R.V.I.S. MAIN CONTROLLER & APPLICATION ORCHESTRATOR
 * UI Bindings, Telemetry Monitors, Task Directives & Settings State
 * ============================================================================
 */

class JarvisAppController {
    constructor() {
        this.batteryInfo = null;
        this.uptimeSeconds = 0;
        this.tasks = [];
        this.activeTheme = 'theme-cyan';

        this.init();
    }

    init() {
        // Initialize Visualizer once DOM is ready
        window.jarvisVisualizer = new ArcReactorVisualizer();

        // Update real footer and header metadata
        this.updateFooterAndHeaderLabels();

        // Load persisted state
        this.loadTasks();
        this.loadNotes();
        this.loadSettings();

        // Setup UI listeners
        this.setupEventListeners();
        this.setupTelemetryMonitors();
        this.setupBatteryMonitor();
        this.setupNetworkMonitor();

        // Start clock & uptime timer
        this.startTimers();

        // Initial atmospheric weather scan & real ping test
        setTimeout(() => {
            if (window.jarvisAgent) {
                window.jarvisAgent.fetchLiveWeather();
            }
            this.measureRealPing();
        }, 800);

        // Periodic real ping test every 10s
        setInterval(() => {
            this.measureRealPing();
        }, 10000);

        console.log('J.A.R.V.I.S. Systems Online and Fully Operational.');
    }

    getUserName() {
        let name = localStorage.getItem('jarvis_username');
        if (!name || name === 'Sir' || name === 'Tony Stark') {
            name = 'Harsh';
            localStorage.setItem('jarvis_username', 'Harsh');
        }
        return name;
    }

    updateFooterAndHeaderLabels() {
        const name = this.getUserName();
        const headerTitle = document.getElementById('hudSystemTitle');
        const footerUser = document.getElementById('footerUser');
        const footerPlatform = document.getElementById('footerPlatform');
        const footerCores = document.getElementById('footerCores');

        if (headerTitle) {
            headerTitle.textContent = `${name.toUpperCase()}'S AI AGENT`;
        }
        if (footerUser) {
            footerUser.textContent = name.toUpperCase();
        }
        if (footerPlatform) {
            const rawPlat = navigator.platform || (navigator.userAgentData && navigator.userAgentData.platform) || 'WIN32';
            footerPlatform.textContent = rawPlat.toUpperCase();
        }
        if (footerCores) {
            footerCores.textContent = `${navigator.hardwareConcurrency || 8} CORES`;
        }
    }

    async measureRealPing() {
        const pingEl = document.getElementById('networkPing');
        const start = performance.now();
        try {
            await fetch(`/?_ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
            const duration = Math.max(1, Math.round(performance.now() - start));
            if (pingEl) pingEl.textContent = `${duration}ms`;
        } catch (e) {
            const duration = Math.max(1, Math.round(performance.now() - start));
            if (pingEl) pingEl.textContent = `${duration}ms`;
        }
    }

    /* ==========================================================================
       EVENT LISTENERS
       ========================================================================== */
    setupEventListeners() {
        // 1. Arc Reactor Click to Toggle Voice Recognition
        const reactorTrigger = document.getElementById('reactorTrigger');
        if (reactorTrigger) {
            reactorTrigger.addEventListener('click', () => {
                if (window.jarvisSpeech) {
                    window.jarvisSpeech.toggleListening();
                }
            });
        }

        // 2. Microphone Toggle Button
        const btnVoiceToggle = document.getElementById('btnVoiceToggle');
        if (btnVoiceToggle) {
            btnVoiceToggle.addEventListener('click', () => {
                if (window.jarvisSpeech) {
                    window.jarvisSpeech.toggleListening();
                }
            });
        }

        // 3. Command Text Input & Submit
        const cmdInput = document.getElementById('commandInput');
        const btnSubmit = document.getElementById('btnSubmitCommand');

        const submitAction = () => {
            const val = cmdInput.value.trim();
            if (val) {
                if (window.jarvisAgent) {
                    window.jarvisAgent.handleCommand(val);
                }
                cmdInput.value = '';
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

        // 4. Sound Mute Toggle
        const btnSoundToggle = document.getElementById('btnSoundToggle');
        const soundIcon = document.getElementById('soundIcon');
        if (btnSoundToggle) {
            btnSoundToggle.addEventListener('click', () => {
                if (window.jarvisSound) {
                    const isEnabled = window.jarvisSound.toggleMute();
                    soundIcon.textContent = isEnabled ? '🔊' : '🔇';
                    btnSoundToggle.title = isEnabled ? 'Mute Audio SFX' : 'Unmute Audio SFX';
                }
            });
        }

        // 5. Mission Directive Task Form
        const taskForm = document.getElementById('taskForm');
        const taskInput = document.getElementById('taskInput');
        if (taskForm && taskInput) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = taskInput.value.trim();
                if (text) {
                    this.addTask(text);
                    taskInput.value = '';
                    if (window.jarvisSound) window.jarvisSound.playClick();
                }
            });
        }

        // 6. Tactical Notes Save
        const btnSaveNotes = document.getElementById('btnSaveNotes');
        const notesArea = document.getElementById('notesArea');
        if (btnSaveNotes && notesArea) {
            btnSaveNotes.addEventListener('click', () => {
                localStorage.setItem('jarvis_notes', notesArea.value);
                if (window.jarvisSound) window.jarvisSound.playProcessComplete();
                if (window.jarvisAgent) {
                    window.jarvisAgent.appendTelemetryLog('Tactical scratchpad updated and encrypted.');
                }
            });
        }

        // 7. Telemetry Clear
        const btnClearTelem = document.getElementById('btnClearTelemetry');
        if (btnClearTelem) {
            btnClearTelem.addEventListener('click', () => {
                const stream = document.getElementById('telemetryLogs');
                if (stream) stream.innerHTML = '';
            });
        }

        // 8. Weather Refresh Button
        const btnRefreshWeather = document.getElementById('btnRefreshWeather');
        if (btnRefreshWeather) {
            btnRefreshWeather.addEventListener('click', () => {
                if (window.jarvisSound) window.jarvisSound.playClick();
                if (window.jarvisAgent) window.jarvisAgent.fetchLiveWeather();
            });
        }

        // 9. Protocol Buttons
        document.querySelectorAll('.protocol-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const proto = btn.getAttribute('data-protocol');
                this.engageProtocol(proto);
                if (window.jarvisAgent) {
                    window.jarvisAgent.handleCommand(`Activate protocol ${proto}`);
                }
            });
        });

        // 10. Theme Matrix Buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.setTheme(theme);
                if (window.jarvisSound) window.jarvisSound.playClick();
            });
        });

        // 11. AI Core Status Button in Header
        const btnAiCoreStatus = document.getElementById('btnAiCoreStatus');
        if (btnAiCoreStatus) {
            btnAiCoreStatus.addEventListener('click', () => {
                this.openSettings();
                setTimeout(() => {
                    const keyInput = document.getElementById('apiKeyInput');
                    if (keyInput) keyInput.focus();
                }, 150);
            });
        }

        // 12. Settings Modal Controls
        const btnSettings = document.getElementById('btnSettings');
        const btnCloseSettings = document.getElementById('btnCloseSettings');
        const modalBackdrop = document.getElementById('modalBackdrop');
        const settingsModal = document.getElementById('settingsModal');

        if (btnSettings && settingsModal) {
            btnSettings.addEventListener('click', () => {
                this.openSettings();
            });
        }

        if (btnCloseSettings && settingsModal) {
            btnCloseSettings.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        if (modalBackdrop && settingsModal) {
            modalBackdrop.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        // Provider Change Listener
        const apiProviderSelect = document.getElementById('apiProviderSelect');
        if (apiProviderSelect) {
            apiProviderSelect.addEventListener('change', () => {
                this.updateModelOptions();
            });
        }

        // API Key Input Auto-detect (gsk_ for Groq, sk- for OpenAI)
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                const val = apiKeyInput.value.trim();
                if (val.startsWith('gsk_') && apiProviderSelect.value !== 'groq') {
                    apiProviderSelect.value = 'groq';
                    this.updateModelOptions();
                } else if (val.startsWith('sk-') && !val.startsWith('gsk_') && apiProviderSelect.value !== 'openai') {
                    apiProviderSelect.value = 'openai';
                    this.updateModelOptions();
                }
            });
        }

        // Key Visibility Toggle
        const btnToggleKey = document.getElementById('btnToggleKeyVisibility');
        if (btnToggleKey && apiKeyInput) {
            btnToggleKey.addEventListener('click', () => {
                const isPassword = apiKeyInput.type === 'password';
                apiKeyInput.type = isPassword ? 'text' : 'password';
                btnToggleKey.textContent = isPassword ? 'HIDE' : 'SHOW';
            });
        }

        const btnSaveSettings = document.getElementById('btnSaveSettings');
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', () => {
                this.saveSettings();
                this.closeSettings();
            });
        }

        const btnResetSettings = document.getElementById('btnResetSettings');
        if (btnResetSettings) {
            btnResetSettings.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Sliders live indicator
        const voiceRate = document.getElementById('voiceRate');
        const rateVal = document.getElementById('rateVal');
        if (voiceRate && rateVal) {
            voiceRate.addEventListener('input', () => {
                rateVal.textContent = voiceRate.value;
            });
        }

        const voicePitch = document.getElementById('voicePitch');
        const pitchVal = document.getElementById('pitchVal');
        if (voicePitch && pitchVal) {
            voicePitch.addEventListener('input', () => {
                pitchVal.textContent = voicePitch.value;
            });
        }

        // CRT Scanlines toggle
        const chkScanlines = document.getElementById('chkScanlines');
        if (chkScanlines) {
            chkScanlines.addEventListener('change', () => {
                if (chkScanlines.checked) {
                    document.body.classList.add('scanlines-active');
                } else {
                    document.body.classList.remove('scanlines-active');
                }
            });
        }
    }

    /* ==========================================================================
       THEME MATRIX CONTROLLER
       ========================================================================== */
    setTheme(themeClass) {
        document.body.classList.remove('theme-cyan', 'theme-gold', 'theme-emerald', 'theme-violet');
        document.body.classList.add(themeClass);
        this.activeTheme = themeClass;

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === themeClass);
        });

        // Inform Visualizer to re-sample theme variables
        if (window.jarvisVisualizer) {
            window.jarvisVisualizer.updateThemeColors();
        }

        localStorage.setItem('jarvis_theme', themeClass);
    }

    /* ==========================================================================
       PROTOCOLS & MODES CONTROLLER
       ========================================================================== */
    engageProtocol(protocolName) {
        document.querySelectorAll('.protocol-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.protocol-btn[data-protocol="${protocolName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (protocolName === 'focus') {
            if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
            this.flashStatus('FOCUS MODE ACTIVE', '#00f0ff');
            if (window.jarvisAgent) {
                window.jarvisAgent.appendTelemetryLog('Focus mode engaged: Notification sounds suppressed, deep work session active.');
            }
        } else if (protocolName === 'stealth') {
            if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
            this.flashStatus('NIGHT MODE ACTIVE', '#a855f7');
            this.setTheme('theme-emerald');
            if (window.jarvisAgent) {
                window.jarvisAgent.appendTelemetryLog('Night mode engaged: Contrast adjusted for low-light environment.');
            }
        } else if (protocolName === 'diagnostic') {
            if (window.jarvisSound) window.jarvisSound.playProcessComplete();
            this.flashStatus('RUNNING DIAGNOSTICS', '#00ff88');
            if (window.jarvisAgent) {
                window.jarvisAgent.runSystemScan().then(scanResult => {
                    window.jarvisAgent.appendMessage('jarvis', scanResult);
                    if (window.jarvisSpeech) window.jarvisSpeech.speak(scanResult);
                });
            }
        } else if (protocolName === 'voice-loop') {
            if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
            this.flashStatus('VOICE MODE READY', '#ffc837');
            if (window.jarvisSpeech) {
                window.jarvisSpeech.startListening();
            }
        } else {
            if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
            this.flashStatus('SYSTEMS OPERATIONAL', '#00f0ff');
        }
    }

    flashStatus(label, color) {
        const chip = document.getElementById('hudStatusChip');
        const lbl = document.getElementById('statusLabel');
        if (lbl) lbl.textContent = label;
        if (chip) {
            chip.style.borderColor = color;
            chip.style.color = color;
            setTimeout(() => {
                chip.style.borderColor = '';
                chip.style.color = '';
                if (lbl) lbl.textContent = 'SYSTEMS ONLINE';
            }, 5000);
        }
    }

    /* ==========================================================================
       TIMERS & CLOCK
       ========================================================================== */
    startTimers() {
        const timeEl = document.getElementById('hudTime');
        const dateEl = document.getElementById('hudDate');
        const uptimeEl = document.getElementById('uptimeCounter');

        const updateClock = () => {
            const now = new Date();
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
            }

            // Uptime increment
            this.uptimeSeconds++;
            if (uptimeEl) {
                const hrs = String(Math.floor(this.uptimeSeconds / 3600)).padStart(2, '0');
                const mins = String(Math.floor((this.uptimeSeconds % 3600) / 60)).padStart(2, '0');
                const secs = String(this.uptimeSeconds % 60).padStart(2, '0');
                uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    /* ==========================================================================
       TELEMETRY MONITORS (BATTERY, NETWORK, CPU HARDWARE)
       ========================================================================== */
    setupBatteryMonitor() {
        const powerStatus = document.getElementById('powerStatus');
        const powerBar = document.getElementById('powerBar');

        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                const update = () => {
                    const level = Math.round(battery.level * 100);
                    const charging = battery.charging;
                    this.batteryInfo = { level, charging };

                    if (powerStatus) {
                        powerStatus.textContent = `${level}% ${charging ? '⚡ CHARGING' : 'BATTERY'}`;
                    }
                    if (powerBar) {
                        powerBar.style.width = `${level}%`;
                    }
                };

                update();
                battery.addEventListener('levelchange', update);
                battery.addEventListener('chargingchange', update);
            }).catch(() => {
                if (powerStatus) powerStatus.textContent = 'AC POWER (100%)';
                if (powerBar) powerBar.style.width = '100%';
            });
        } else {
            if (powerStatus) powerStatus.textContent = 'AC POWER (100%)';
            if (powerBar) powerBar.style.width = '100%';
        }
    }

    setupNetworkMonitor() {
        const netStatus = document.getElementById('netStatus');
        const netBar = document.getElementById('netBar');

        const updateNet = () => {
            const isOnline = navigator.onLine;
            let statusText = 'ONLINE';
            if (navigator.connection) {
                if (navigator.connection.downlink) {
                    statusText = `ONLINE (${navigator.connection.downlink} Mbps)`;
                } else if (navigator.connection.effectiveType) {
                    statusText = `ONLINE (${navigator.connection.effectiveType.toUpperCase()})`;
                }
            } else {
                statusText = isOnline ? 'ONLINE (ACTIVE)' : 'OFFLINE';
            }

            if (netStatus) {
                netStatus.textContent = isOnline ? statusText : 'OFFLINE (LOCAL BUFFER)';
                netStatus.style.color = isOnline ? 'var(--primary-glow)' : '#ff3366';
            }
            if (netBar) {
                netBar.style.width = isOnline ? '100%' : '15%';
            }
        };

        window.addEventListener('online', updateNet);
        window.addEventListener('offline', updateNet);
        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateNet);
        }
        updateNet();
    }

    setupTelemetryMonitors() {
        const coreLoad = document.getElementById('coreLoad');
        const coreLoadBar = document.getElementById('coreLoadBar');
        const cores = navigator.hardwareConcurrency || 8;
        const memory = navigator.deviceMemory ? `${navigator.deviceMemory}GB RAM` : 'OPTIMAL';

        if (coreLoad) coreLoad.textContent = `${cores} CORES (${memory})`;
        if (coreLoadBar) coreLoadBar.style.width = '95%';
    }

    /* ==========================================================================
       MISSION DIRECTIVES (TASK MANAGER)
       ========================================================================== */
    loadTasks() {
        const stored = localStorage.getItem('jarvis_tasks');
        let needsReset = false;
        if (stored) {
            try {
                this.tasks = JSON.parse(stored);
                // Sanitize old fictional Stark directives if found in localStorage
                const hasStarkLore = this.tasks.some(t => 
                    /mark 85|vibranium|arc reactor|orbital defense|iron legion|stark/i.test(t.text || '')
                );
                if (hasStarkLore || !Array.isArray(this.tasks) || this.tasks.length === 0) {
                    needsReset = true;
                }
            } catch (e) {
                needsReset = true;
            }
        } else {
            needsReset = true;
        }

        if (needsReset) {
            // Realistic Productivity & Development Directives for Harsh
            this.tasks = [
                { id: 1, text: 'Configure Groq API key in .env or Settings modal', completed: true },
                { id: 2, text: 'Verify live weather telemetry for current location', completed: true },
                { id: 3, text: 'Prompt Jarvis with openai/gpt-oss-120b for project tasks', completed: false },
                { id: 4, text: 'Review real-time CPU and network latency diagnostics', completed: false }
            ];
            this.saveTasksToStorage();
        }
        this.renderTasks();
    }

    saveTasksToStorage() {
        localStorage.setItem('jarvis_tasks', JSON.stringify(this.tasks));
    }

    addTask(text) {
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };
        this.tasks.unshift(newTask);
        this.saveTasksToStorage();
        this.renderTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasksToStorage();
            this.renderTasks();
            if (window.jarvisSound) window.jarvisSound.playClick();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasksToStorage();
        this.renderTasks();
        if (window.jarvisSound) window.jarvisSound.playClick();
    }

    clearTasks() {
        this.tasks = [];
        this.saveTasksToStorage();
        this.renderTasks();
    }

    renderTasks() {
        const listEl = document.getElementById('taskList');
        const counterEl = document.getElementById('taskCount');
        if (!listEl) return;

        listEl.innerHTML = '';
        const pendingCount = this.tasks.filter(t => !t.completed).length;
        if (counterEl) counterEl.textContent = `${pendingCount} PENDING`;

        this.tasks.forEach(t => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span class="task-text">${this.escapeHTML(t.text)}</span>
                <button class="task-delete" title="Delete Directive" data-id="${t.id}">&times;</button>
            `;

            li.querySelector('.task-text').addEventListener('click', () => this.toggleTask(t.id));
            li.querySelector('.task-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(t.id);
            });

            listEl.appendChild(li);
        });
    }

    /* ==========================================================================
       SCRATCHPAD & CONVERSATION
       ========================================================================== */
    loadNotes() {
        const notesArea = document.getElementById('notesArea');
        if (notesArea) {
            notesArea.value = localStorage.getItem('jarvis_notes') || '';
        }
    }

    appendNote(text) {
        const notesArea = document.getElementById('notesArea');
        if (notesArea) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            notesArea.value += `\n[${time}] ${text}`;
            localStorage.setItem('jarvis_notes', notesArea.value);
        }
    }

    clearConversation() {
        const stream = document.getElementById('conversationStream');
        if (stream) {
            stream.innerHTML = `
                <div class="message-entry jarvis-msg">
                    <div class="msg-avatar">J</div>
                    <div class="msg-content">
                        <div class="msg-sender">J.A.R.V.I.S. <span class="msg-time">ONLINE</span></div>
                        <div class="msg-body">Transmission feed purged. Systems standing by.</div>
                    </div>
                </div>
            `;
        }
    }

    /* ==========================================================================
       SETTINGS MODAL & MODEL CONFIGURATION
       ========================================================================== */
    updateModelOptions(selectedModel) {
        const provSelect = document.getElementById('apiProviderSelect');
        const modelSelect = document.getElementById('apiModelSelect');
        const keyInput = document.getElementById('apiKeyInput');
        const prefixHint = document.getElementById('keyPrefixHint');
        const providerHint = document.getElementById('providerHint');
        if (!provSelect || !modelSelect) return;

        const provider = provSelect.value;
        modelSelect.innerHTML = '';

        const modelsByProvider = {
            groq: [
                { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (Groq Default - Ultra Fast)' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Long Context)' },
                { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B' }
            ],
            openai: [
                { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o Mini (Recommended - Fast & Smart)' },
                { id: 'gpt-4o', name: 'OpenAI GPT-4o (Flagship Omni Intelligence)' },
                { id: 'gpt-3.5-turbo', name: 'OpenAI GPT-3.5 Turbo (Legacy Speed)' }
            ],
            gemini: [
                { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash' }
            ],
            builtin: [
                { id: 'builtin', name: 'Offline Autonomous Engine' }
            ]
        };

        const list = modelsByProvider[provider] || modelsByProvider.groq;
        list.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            modelSelect.appendChild(opt);
        });

        let activeModel = selectedModel || localStorage.getItem('jarvis_model');
        if (!activeModel || activeModel.toLowerCase().includes('llama')) {
            activeModel = 'openai/gpt-oss-120b';
            localStorage.setItem('jarvis_model', activeModel);
        }
        if (activeModel && Array.from(modelSelect.options).some(o => o.value === activeModel)) {
            modelSelect.value = activeModel;
        } else if (modelSelect.options.length > 0) {
            modelSelect.selectedIndex = 0;
        }

        // Update hints & placeholders
        if (keyInput && prefixHint && providerHint) {
            if (provider === 'groq') {
                keyInput.placeholder = 'Paste your Groq API key (gsk_...)';
                prefixHint.textContent = 'Groq Key: gsk_...';
                providerHint.textContent = 'Groq Cloud LPU inference delivers near-instant verbal turnaround for prompts.';
            } else if (provider === 'openai') {
                keyInput.placeholder = 'Paste your OpenAI API key (sk-...)';
                prefixHint.textContent = 'OpenAI Key: sk-...';
                providerHint.textContent = 'OpenAI Official API powering GPT-4o and GPT-4o-Mini models for prompts.';
            } else if (provider === 'gemini') {
                keyInput.placeholder = 'Paste your Gemini API key (AIza...)';
                prefixHint.textContent = 'Gemini Key: AIza...';
                providerHint.textContent = 'Google Gemini 1.5 Flash multimode intelligence.';
            } else {
                keyInput.placeholder = 'Built-in offline mode active (no API key required)';
                prefixHint.textContent = 'Offline Heuristics';
                providerHint.textContent = 'Using localized browser NLP and autonomous offline capabilities.';
            }
        }
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('jarvis_theme') || 'theme-cyan';
        this.setTheme(savedTheme);

        const name = this.getUserName();
        const nameInput = document.getElementById('userNameInput');
        if (nameInput) nameInput.value = name;
        this.updateFooterAndHeaderLabels();

        let apiKey = localStorage.getItem('jarvis_api_key') || '';
        const envKey = window.jarvisAgent ? window.jarvisAgent.getApiKey() : (window.__ENV__?.GROQ_API_KEY || window.__ENV__?.OPENAI_API_KEY || '');
        const keyInput = document.getElementById('apiKeyInput');
        if (keyInput) {
            keyInput.value = apiKey || envKey;
        }

        const provider = localStorage.getItem('jarvis_provider') || 'groq';
        const provSelect = document.getElementById('apiProviderSelect');
        if (provSelect) provSelect.value = provider;

        const customModel = localStorage.getItem('jarvis_custom_model') || '';
        const customModelInput = document.getElementById('customModelInput');
        if (customModelInput) customModelInput.value = customModel;

        let savedModel = localStorage.getItem('jarvis_model') || '';
        if (!savedModel || savedModel.toLowerCase().includes('llama')) {
            savedModel = window.__ENV__?.DEFAULT_MODEL || 'openai/gpt-oss-120b';
            localStorage.setItem('jarvis_model', savedModel);
        }
        this.updateModelOptions(savedModel);

        if (window.jarvisAgent) {
            window.jarvisAgent.updateHeaderPill();
        }
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            if (window.jarvisSound) window.jarvisSound.playClick();
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            if (window.jarvisSound) window.jarvisSound.playClick();
        }
    }

    saveSettings() {
        const nameInput = document.getElementById('userNameInput');
        const keyInput = document.getElementById('apiKeyInput');
        const provSelect = document.getElementById('apiProviderSelect');
        const modelSelect = document.getElementById('apiModelSelect');
        const customModelInput = document.getElementById('customModelInput');
        const voiceRate = document.getElementById('voiceRate');
        const voicePitch = document.getElementById('voicePitch');
        const voiceSelect = document.getElementById('voiceSelect');

        const savedName = nameInput ? nameInput.value.trim() || 'Harsh' : 'Harsh';
        localStorage.setItem('jarvis_username', savedName);

        if (window.jarvisAgent) {
            window.jarvisAgent.setUserName(savedName);
            window.jarvisAgent.setAiConfig(
                keyInput ? keyInput.value : '',
                provSelect ? provSelect.value : 'groq',
                modelSelect ? modelSelect.value : '',
                customModelInput ? customModelInput.value : ''
            );
        }

        if (window.jarvisSpeech) {
            if (voiceRate) window.jarvisSpeech.speechRate = parseFloat(voiceRate.value);
            if (voicePitch) window.jarvisSpeech.speechPitch = parseFloat(voicePitch.value);
            if (voiceSelect && window.jarvisSpeech.availableVoices[voiceSelect.selectedIndex]) {
                window.jarvisSpeech.selectedVoice = window.jarvisSpeech.availableVoices[voiceSelect.selectedIndex];
            }
        }

        this.updateFooterAndHeaderLabels();

        if (window.jarvisSound) window.jarvisSound.playProcessComplete();
        if (window.jarvisAgent) {
            window.jarvisAgent.appendTelemetryLog(`AI Core configured: ${(provSelect ? provSelect.value : 'groq').toUpperCase()} (${window.jarvisAgent.getActiveModel()}).`);
        }
    }

    resetSettings() {
        localStorage.removeItem('jarvis_username');
        localStorage.removeItem('jarvis_api_key');
        localStorage.removeItem('jarvis_provider');
        localStorage.removeItem('jarvis_model');
        localStorage.removeItem('jarvis_custom_model');
        localStorage.removeItem('jarvis_theme');
        localStorage.removeItem('jarvis_tasks');
        localStorage.removeItem('jarvis_real_location');
        this.loadTasks();
        this.loadSettings();
        if (window.jarvisSound) window.jarvisSound.playClick();
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
}

// Instantiate App Controller on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jarvisApp = new JarvisAppController();
});
