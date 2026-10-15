/**
 * ============================================================================
 * J.A.R.V.I.S. SETTINGS MODAL VIEW (V - MVC)
 * Modal Dialog Presentation, Provider/Model Selectors, API Key Inputs & Sliders
 * ============================================================================
 */

class SettingsModalView {
    constructor(configModel) {
        this.config = configModel;

        this.modal = document.getElementById('settingsModal');
        this.backdrop = document.getElementById('modalBackdrop');
        this.userNameInput = document.getElementById('userNameInput');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.apiProviderSelect = document.getElementById('apiProviderSelect');
        this.apiModelSelect = document.getElementById('apiModelSelect');
        this.customModelInput = document.getElementById('customModelInput');
        this.voiceRate = document.getElementById('voiceRate');
        this.rateVal = document.getElementById('rateVal');
        this.voicePitch = document.getElementById('voicePitch');
        this.pitchVal = document.getElementById('pitchVal');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speechLangSelect = document.getElementById('speechLangSelect');
        this.chkScanlines = document.getElementById('chkScanlines');
        this.keyPrefixHint = document.getElementById('keyPrefixHint');
        this.providerHint = document.getElementById('providerHint');

        this.modelsByProvider = {
            groq: [
                { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Recommended - Active Flagship Model)' },
                { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Ultra-Fast <100ms Inference)' },
                { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (High Context & Reasoning)' },
                { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B Versatile' },
                { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B Instant' }
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
                { id: 'builtin', name: 'Stark Offline Autonomous Engine' }
            ]
        };

        // Populate fields initially
        this.syncFromConfig();

        // Subscribe to config changes
        this.config.subscribe((key) => {
            if (key === 'reset_defaults' || key === 'config_loaded') {
                this.syncFromConfig();
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add('active');
            this.modal.setAttribute('aria-hidden', 'false');
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            this.modal.setAttribute('aria-hidden', 'true');
        }
    }

    syncFromConfig() {
        if (this.userNameInput) this.userNameInput.value = this.config.userName;
        if (this.apiKeyInput) this.apiKeyInput.value = this.config.getApiKey();
        if (this.customModelInput) this.customModelInput.value = this.config.customModel;
        if (this.chkScanlines) this.chkScanlines.checked = this.config.scanlines;

        if (this.apiProviderSelect) {
            this.apiProviderSelect.value = this.config.provider;
        }

        if (this.voiceRate && this.rateVal) {
            this.voiceRate.value = this.config.voiceRate;
            this.rateVal.textContent = this.config.voiceRate;
        }

        if (this.voicePitch && this.pitchVal) {
            this.voicePitch.value = this.config.voicePitch;
            this.pitchVal.textContent = this.config.voicePitch;
        }

        if (this.speechLangSelect) {
            this.speechLangSelect.value = localStorage.getItem('jarvis_speech_lang') || 'en-US';
        }

        this.updateModelOptions(this.config.model);
    }

    updateModelOptions(selectedModel) {
        if (!this.apiProviderSelect || !this.apiModelSelect) return;

        const provider = this.apiProviderSelect.value;
        this.apiModelSelect.innerHTML = '';

        const list = this.modelsByProvider[provider] || this.modelsByProvider.groq;
        list.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            this.apiModelSelect.appendChild(opt);
        });

        const activeModel = selectedModel || this.config.model;
        if (activeModel && Array.from(this.apiModelSelect.options).some(o => o.value === activeModel)) {
            this.apiModelSelect.value = activeModel;
        }

        // Update hints
        if (this.apiKeyInput && this.keyPrefixHint && this.providerHint) {
            if (provider === 'groq') {
                this.apiKeyInput.placeholder = 'Paste your Groq API key (gsk_...)';
                this.keyPrefixHint.textContent = 'Groq Key: gsk_...';
                this.providerHint.textContent = 'Groq Cloud LPU inference delivers near-instant verbal turnaround for prompts.';
            } else if (provider === 'openai') {
                this.apiKeyInput.placeholder = 'Paste your OpenAI API key (sk-...)';
                this.keyPrefixHint.textContent = 'OpenAI Key: sk-...';
                this.providerHint.textContent = 'OpenAI Official API powering GPT-4o and GPT-4o-Mini models for prompts.';
            } else if (provider === 'gemini') {
                this.apiKeyInput.placeholder = 'Paste your Gemini API key (AIza...)';
                this.keyPrefixHint.textContent = 'Gemini Key: AIza...';
                this.providerHint.textContent = 'Google Gemini 1.5 Flash multimode intelligence.';
            } else {
                this.apiKeyInput.placeholder = 'Built-in offline mode active (no API key required)';
                this.keyPrefixHint.textContent = 'Offline Heuristics';
                this.providerHint.textContent = 'Using localized Stark Industries NLP and autonomous offline skills.';
            }
        }
    }

    getFormData() {
        return {
            userName: this.userNameInput ? this.userNameInput.value : 'Sir',
            apiKey: this.apiKeyInput ? this.apiKeyInput.value : '',
            provider: this.apiProviderSelect ? this.apiProviderSelect.value : 'groq',
            model: this.apiModelSelect ? this.apiModelSelect.value : '',
            customModel: this.customModelInput ? this.customModelInput.value : '',
            scanlines: this.chkScanlines ? this.chkScanlines.checked : true,
            voiceRate: this.voiceRate ? parseFloat(this.voiceRate.value) : 1.0,
            voicePitch: this.voicePitch ? parseFloat(this.voicePitch.value) : 1.0,
            voiceIndex: this.voiceSelect ? this.voiceSelect.selectedIndex : 0,
            speechLang: this.speechLangSelect ? this.speechLangSelect.value : 'en-US'
        };
    }
}
