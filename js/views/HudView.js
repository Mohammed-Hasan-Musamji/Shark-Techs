/**
 * ============================================================================
 * J.A.R.V.I.S. HUD VIEW (V - MVC)
 * Header Clock, Uptime Counter, AI Core Pill, Status Chip, Modes & Armor Themes
 * ============================================================================
 */

class HudView {
    constructor(configModel, telemetryModel) {
        this.config = configModel;
        this.telemetry = telemetryModel;

        this.timeEl = document.getElementById('hudTime');
        this.dateEl = document.getElementById('hudDate');
        this.uptimeEl = document.getElementById('uptimeCounter');
        this.pingEl = document.getElementById('networkPing');
        this.aiCorePill = document.getElementById('btnAiCoreStatus');
        this.aiCoreLabel = document.getElementById('aiCoreLabel');
        this.statusChip = document.getElementById('hudStatusChip');
        this.statusLabel = document.getElementById('statusLabel');

        // Footer elements
        this.footerUser = document.getElementById('footerUser');
        this.footerPlatform = document.getElementById('footerPlatform');
        this.footerCores = document.getElementById('footerCores');
        this.agentModeDesc = document.getElementById('agentModeDesc');

        // Apply initial config
        this.applyTheme(this.config.theme);
        this.applyScanlines(this.config.scanlines);
        this.updateAiCoreBadge();
        this.updateUserLabels();
        this.updateHardwareLabels();

        // Subscribe to models
        this.config.subscribe((key) => {
            if (key === 'theme_changed' || key === 'reset_defaults') {
                this.applyTheme(this.config.theme);
            }
            if (key === 'scanlines_changed' || key === 'reset_defaults') {
                this.applyScanlines(this.config.scanlines);
            }
            if (key === 'ai_config_changed' || key === 'config_loaded' || key === 'reset_defaults') {
                this.updateAiCoreBadge();
            }
            if (key === 'username_changed' || key === 'reset_defaults') {
                this.updateUserLabels();
            }
        });

        this.telemetry.subscribe((type, data) => {
            if (type === 'uptime_updated') {
                this.renderUptime(data);
            }
            if (type === 'ping_updated') {
                this.renderPing(data);
            }
            if (type === 'protocol_changed') {
                this.renderProtocol(data);
            }
        });
    }

    updateUserLabels() {
        const name = this.config.userName || 'Harsh';
        if (this.footerUser) this.footerUser.textContent = name.toUpperCase();
        if (this.agentModeDesc && (!window.jarvisVisualizer || window.jarvisVisualizer.state === 'standby')) {
            this.agentModeDesc.textContent = `Awaiting your instruction, ${name}.`;
        }
    }

    updateHardwareLabels() {
        if (this.footerPlatform) {
            this.footerPlatform.textContent = (this.telemetry.hardware.platform || 'WIN32').toUpperCase();
        }
        if (this.footerCores) {
            this.footerCores.textContent = `${this.telemetry.hardware.cores} CORES`;
        }
    }

    renderClock() {
        const now = new Date();
        if (this.timeEl) {
            this.timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (this.dateEl) {
            this.dateEl.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
        }
    }

    renderUptime(totalSeconds) {
        if (!this.uptimeEl) return;
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');
        this.uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
    }

    renderPing(pingText) {
        if (this.pingEl) {
            this.pingEl.textContent = typeof pingText === 'number' ? `${pingText}ms` : pingText;
        }
    }

    applyTheme(themeClass) {
        document.body.classList.remove('theme-cyan', 'theme-gold', 'theme-emerald', 'theme-violet');
        document.body.classList.add(themeClass);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === themeClass);
        });
    }

    applyScanlines(enabled) {
        if (enabled) {
            document.body.classList.add('scanlines-active');
        } else {
            document.body.classList.remove('scanlines-active');
        }
        const chk = document.getElementById('chkScanlines');
        if (chk) chk.checked = enabled;
    }

    updateAiCoreBadge() {
        if (!this.aiCorePill || !this.aiCoreLabel) return;

        this.aiCorePill.classList.remove('active-groq', 'active-openai');

        const activeKey = this.config.getApiKey();
        const provider = this.config.provider;

        if (!activeKey && provider !== 'builtin') {
            this.aiCoreLabel.textContent = 'CONNECT API KEY';
            this.aiCorePill.title = 'Click to connect your Groq or OpenAI API key';
            return;
        }

        if (provider === 'groq') {
            this.aiCorePill.classList.add('active-groq');
            const modelName = this.config.getActiveModel().replace('openai/', '').toUpperCase();
            this.aiCoreLabel.textContent = `GROQ: ${modelName}`;
            this.aiCorePill.title = `Active Core: Groq LPU (${this.config.getActiveModel()})`;
        } else if (provider === 'openai') {
            this.aiCorePill.classList.add('active-openai');
            this.aiCoreLabel.textContent = `OPENAI: ${this.config.getActiveModel().toUpperCase()}`;
            this.aiCorePill.title = `Active Core: OpenAI Official (${this.config.getActiveModel()})`;
        } else if (provider === 'gemini') {
            this.aiCoreLabel.textContent = 'GEMINI: 1.5-FLASH';
            this.aiCorePill.title = 'Active Core: Google Gemini 1.5 Flash';
        } else {
            this.aiCoreLabel.textContent = 'OFFLINE ENGINE';
            this.aiCorePill.title = 'Operating on local heuristic knowledge engine';
        }
    }

    renderProtocol(protocolName) {
        document.querySelectorAll('.protocol-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-protocol') === protocolName);
        });

        if (protocolName === 'focus') {
            this.flashStatus('FOCUS MODE ENGAGED', '#00f0ff');
        } else if (protocolName === 'stealth') {
            this.flashStatus('NIGHT MODE ACTIVE', '#00ff88');
        } else if (protocolName === 'diagnostic') {
            this.flashStatus('DIAGNOSTICS RUNNING', '#ffc837');
        } else if (protocolName === 'voice-loop') {
            this.flashStatus('VOICE MODE ACTIVE', '#ff3366');
        } else if (protocolName === 'red-alert') {
            this.flashStatus('RED ALERT ENGAGED', '#ff3366');
        } else if (protocolName === 'house-party') {
            this.flashStatus('HOUSE PARTY PROTOCOL', '#ffc837');
        }
    }

    flashStatus(label, color) {
        if (this.statusLabel) this.statusLabel.textContent = label;
        if (this.statusChip) {
            this.statusChip.style.borderColor = color;
            this.statusChip.style.color = color;
            clearTimeout(this._flashTimeout);
            this._flashTimeout = setTimeout(() => {
                this.statusChip.style.borderColor = '';
                this.statusChip.style.color = '';
                if (this.statusLabel) this.statusLabel.textContent = 'SYSTEMS ONLINE';
            }, 5000);
        }
    }
}
