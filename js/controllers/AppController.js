/**
 * ============================================================================
 * J.A.R.V.I.S. MAIN APP CONTROLLER & BOOTSTRAPPER (MVC Orchestrator)
 * Assembles Models, Views, and Controllers into an integrated system architecture
 * Desktop Applications Matrix, Web Search Automation & PWA Support
 * ============================================================================
 */

class AppController {
    constructor() {
        this.models = {};
        this.views = {};
        this.controllers = {};

        this.bootstrap();
    }

    bootstrap() {
        console.log('[MVC] Initializing J.A.R.V.I.S. Architecture...');

        // 1. Initialize Models (Data & State)
        this.models.config = new ConfigModel();
        this.models.directives = new DirectiveModel();
        this.models.telemetry = new TelemetryModel();
        this.models.conversation = new ConversationModel();
        this.models.systemBridge = new SystemBridgeModel();
        this.models.agent = new AgentModel(
            this.models.config,
            this.models.directives,
            this.models.telemetry,
            this.models.conversation,
            this.models.systemBridge
        );

        // 2. Initialize Views (Presentation & DOM)
        this.views.audio = new AudioView(this.models.config);
        this.views.visualizer = new VisualizerView(this.models.config);
        this.views.speech = new SpeechView(this.models.config);
        this.views.hud = new HudView(this.models.config, this.models.telemetry);
        this.views.telemetry = new TelemetryView(this.models.telemetry, this.models.systemBridge);
        this.views.conversation = new ConversationView(this.models.conversation);
        this.views.directives = new DirectiveView(this.models.directives);
        this.views.settingsModal = new SettingsModalView(this.models.config);
        this.views.mobileConnect = new MobileConnectView(this.models.systemBridge, this.views.audio);

        // 3. Initialize Controllers (Event Dispatch & Coordination)
        this.controllers.directives = new DirectiveController(
            this.models.directives,
            this.views.directives,
            this.views.audio,
            this.models.telemetry
        );

        this.controllers.telemetry = new TelemetryController(
            this.models.telemetry,
            this.models.config,
            this.views.hud,
            this.views.telemetry,
            this.views.audio
        );

        this.controllers.settings = new SettingsController(
            this.models.config,
            this.views.settingsModal,
            this.views.audio,
            this.models.telemetry
        );

        this.controllers.agent = new AgentController(
            this.models.agent,
            this.models.conversation,
            this.views.conversation,
            this.views.visualizer,
            this.views.speech,
            this.views.audio,
            this.models.telemetry,
            this.models.directives,
            this.models.config,
            this.models.systemBridge
        );

        // 4. Setup Desktop App Launcher & Search Modal Listeners
        this.setupAppsLauncher();

        // 5. Expose clean global namespace for console debugging and compatibility
        window.jarvis = this;
        window.jarvisAgent = this.models.agent;
        window.jarvisSpeech = this.views.speech;
        window.jarvisVisualizer = this.views.visualizer;
        window.jarvisSound = this.views.audio;
        window.jarvisBridge = this.models.systemBridge;
        window.jarvisApp = this;

        // 6. System startup telemetry
        this.models.telemetry.appendLog(`[SYSTEM] J.A.R.V.I.S. Mark 85 Core online. Architecture: MVC.`);
        const activeKey = this.models.config.getApiKey();
        if (activeKey) {
            this.models.telemetry.appendLog(`[AI CORE] ${this.models.config.provider.toUpperCase()} LPU connected (${this.models.config.getActiveModel()}).`);
        }
        this.models.telemetry.appendLog(`[BRIDGE] System control & mobile satellite uplink active.`);

        // 7. Initial Atmospheric Scan
        setTimeout(() => {
            this.models.telemetry.fetchLiveWeather();
        }, 1200);

        // 8. Register Service Worker (PWA Caching & Install)
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('[PWA] Service Worker registered.'))
                .catch(err => console.warn('[PWA] Service Worker error:', err.message));
        }

        console.log('J.A.R.V.I.S. Systems Online and Operational in Full MVC Architecture.');
    }

    setupAppsLauncher() {
        const modal = document.getElementById('appsLauncherModal');
        const btnOpen = document.getElementById('btnAppsLauncher');
        const btnClose = document.getElementById('btnCloseAppsLauncher');
        const btnExportChat = document.getElementById('btnExportChat');

        // Toggle Modal
        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => {
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                this.views.audio.playModalOpen();
            });
        }

        if (btnClose && modal) {
            btnClose.addEventListener('click', () => {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                this.views.audio.playClick();
            });
        }

        // Export Chat Button
        if (btnExportChat) {
            btnExportChat.addEventListener('click', () => {
                this.views.audio.playClick();
                this.models.systemBridge.exportConversationHistory('markdown');
            });
        }

        // Search Execution
        const btnSearch = document.getElementById('btnExecuteSearch');
        const searchInput = document.getElementById('launcherSearchInput');
        const engineSelect = document.getElementById('searchEngineSelect');

        const doSearch = () => {
            const query = searchInput ? searchInput.value.trim() : '';
            const engine = engineSelect ? engineSelect.value : 'google';
            if (!query) return;

            let targetUrl;
            if (engine === 'youtube') {
                targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            } else if (engine === 'wikipedia') {
                targetUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
            } else if (engine === 'github') {
                targetUrl = `https://github.com/search?q=${encodeURIComponent(query)}`;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }

            try { window.open(targetUrl, '_blank'); } catch (e) {}
            this.models.systemBridge.searchWeb(query, engine, targetUrl);
            this.models.conversation.addMessage('user', `Search ${engine.toUpperCase()} for "${query}"`);
            this.models.conversation.addMessage('jarvis', `Dispatched search query "${query}" to ${engine.toUpperCase()} on host desktop console.`);
            this.views.audio.playProcessComplete();

            if (modal) modal.classList.remove('active');
            if (searchInput) searchInput.value = '';
        };

        if (btnSearch) btnSearch.addEventListener('click', doSearch);
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doSearch();
                }
            });
        }

        // Notepad Dictation Writing
        const btnWrite = document.getElementById('btnWriteToNotepad');
        const noteInput = document.getElementById('launcherNotepadText');

        const doWrite = () => {
            const text = noteInput ? noteInput.value.trim() : '';
            if (!text) return;

            this.models.systemBridge.openAppWithText('notepad', text);
            this.models.directives.appendNote(`[Dictated] ${text}`);
            this.models.conversation.addMessage('user', `Write in Notepad: "${text}"`);
            this.models.conversation.addMessage('jarvis', `Wrote "${text}" to scratchpad and rendered active document in Windows Notepad.`);
            this.views.audio.playProcessComplete();

            if (modal) modal.classList.remove('active');
            if (noteInput) noteInput.value = '';
        };

        if (btnWrite) btnWrite.addEventListener('click', doWrite);
        if (noteInput) {
            noteInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doWrite();
                }
            });
        }

        // App Launch Grid
        const appBtns = document.querySelectorAll('[data-app-launch]');
        appBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const app = btn.getAttribute('data-app-launch');
                if (app) {
                    this.views.audio.playClick();
                    this.models.systemBridge.openApp(app);
                    this.models.telemetry.appendLog(`[APP] Launching ${app} on host console.`);
                    if (modal) modal.classList.remove('active');
                }
            });
        });

        // Quick System Controls
        const btnMute = document.getElementById('btnQuickMute');
        if (btnMute) btnMute.addEventListener('click', () => {
            this.views.audio.playClick();
            this.models.systemBridge.controlVolume('mute');
        });

        const btnVolUp = document.getElementById('btnQuickVolumeUp');
        if (btnVolUp) btnVolUp.addEventListener('click', () => {
            this.views.audio.playClick();
            this.models.systemBridge.controlVolume('up');
        });

        const btnVolDown = document.getElementById('btnQuickVolumeDown');
        if (btnVolDown) btnVolDown.addEventListener('click', () => {
            this.views.audio.playClick();
            this.models.systemBridge.controlVolume('down');
        });

        const btnScreenshot = document.getElementById('btnQuickScreenshot');
        if (btnScreenshot) btnScreenshot.addEventListener('click', () => {
            this.views.audio.playClick();
            this.models.systemBridge.captureScreenshot();
            if (modal) modal.classList.remove('active');
        });

        const btnLock = document.getElementById('btnQuickLock');
        if (btnLock) btnLock.addEventListener('click', () => {
            this.views.audio.playAlert();
            this.models.systemBridge.lockWorkstation();
        });

        const btnQuickExport = document.getElementById('btnQuickExportHistory');
        if (btnQuickExport) btnQuickExport.addEventListener('click', () => {
            this.views.audio.playClick();
            this.models.systemBridge.exportConversationHistory('markdown');
        });
    }
}
