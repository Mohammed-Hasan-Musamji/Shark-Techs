/**
 * ============================================================================
 * J.A.R.V.I.S. SETTINGS CONTROLLER (C - MVC)
 * Manages configuration dialog, provider switches, API keys, and voice options
 * ============================================================================
 */

class SettingsController {
    constructor(configModel, settingsModalView, audioView, telemetryModel) {
        this.config = configModel;
        this.modal = settingsModalView;
        this.audio = audioView;
        this.telemetry = telemetryModel;

        this.initEventListeners();
    }

    initEventListeners() {
        // Open Settings Modal
        const btnSettings = document.getElementById('btnSettings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                this.modal.open();
                this.audio.playClick();
            });
        }

        // AI Core Status Header Badge opens Settings & focuses input
        const btnAiCoreStatus = document.getElementById('btnAiCoreStatus');
        if (btnAiCoreStatus) {
            btnAiCoreStatus.addEventListener('click', () => {
                this.modal.open();
                this.audio.playClick();
                setTimeout(() => {
                    const keyInput = document.getElementById('apiKeyInput');
                    if (keyInput) keyInput.focus();
                }, 150);
            });
        }

        // Close Settings Modal
        const btnClose = document.getElementById('btnCloseSettings');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.modal.close();
                this.audio.playClick();
            });
        }

        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.modal.close();
                this.audio.playClick();
            });
        }

        // Sound Mute Toggle Button in HUD Header
        const btnSoundToggle = document.getElementById('btnSoundToggle');
        if (btnSoundToggle) {
            btnSoundToggle.addEventListener('click', () => {
                const nextMuted = !this.config.soundMuted;
                this.config.setSoundMuted(nextMuted);
                if (!nextMuted) this.audio.playClick();
            });
        }

        // Provider Select Change
        const provSelect = document.getElementById('apiProviderSelect');
        if (provSelect) {
            provSelect.addEventListener('change', () => {
                this.modal.updateModelOptions();
            });
        }

        // API Key Auto-detection for Groq (gsk_) and OpenAI (sk-)
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput && provSelect) {
            apiKeyInput.addEventListener('input', () => {
                const val = apiKeyInput.value.trim();
                if (val.startsWith('gsk_') && provSelect.value !== 'groq') {
                    provSelect.value = 'groq';
                    this.modal.updateModelOptions();
                } else if (val.startsWith('sk-') && !val.startsWith('gsk_') && provSelect.value !== 'openai') {
                    provSelect.value = 'openai';
                    this.modal.updateModelOptions();
                }
            });
        }

        // Key Visibility Toggle
        const btnToggleKey = document.getElementById('btnToggleKeyVisibility');
        if (btnToggleKey && apiKeyInput) {
            btnToggleKey.addEventListener('click', () => {
                const isPass = apiKeyInput.type === 'password';
                apiKeyInput.type = isPass ? 'text' : 'password';
                btnToggleKey.textContent = isPass ? 'HIDE' : 'SHOW';
            });
        }

        // Live slider indicators
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

        // Save Settings
        const btnSave = document.getElementById('btnSaveSettings');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const form = this.modal.getFormData();
                this.config.setUserName(form.userName);
                this.config.setAiConfig(form.apiKey, form.provider, form.model, form.customModel);
                this.config.setScanlines(form.scanlines);
                this.config.setVoicePreferences(form.voiceRate, form.voicePitch, form.voiceIndex);

                if (form.speechLang) {
                    localStorage.setItem('jarvis_speech_lang', form.speechLang);
                    if (window.jarvisSpeech) {
                        window.jarvisSpeech.setLanguage(form.speechLang);
                    }
                }

                this.modal.close();
                this.audio.playProcessComplete();
                this.telemetry.appendLog(`[CONFIG] Neural parameters updated: ${form.provider.toUpperCase()} (${this.config.getActiveModel()}).`);
            });
        }

        // Reset Settings
        const btnReset = document.getElementById('btnResetSettings');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.config.resetDefaults();
                this.audio.playClick();
                this.telemetry.appendLog('[CONFIG] Settings restored to factory presets.');
            });
        }
    }
}
