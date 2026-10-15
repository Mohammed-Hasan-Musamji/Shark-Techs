/**
 * ============================================================================
 * J.A.R.V.I.S. CONFIG MODEL (M - MVC)
 * Manages API credentials, providers, user identity, and audio preferences
 * ============================================================================
 */

class ConfigModel {
    constructor() {
        this.subscribers = [];

        // Core Identity & AI Provider State
        this.userName = localStorage.getItem('jarvis_username') || 'Harsh';
        this.apiKey = localStorage.getItem('jarvis_api_key') || '';
        this.provider = localStorage.getItem('jarvis_provider') || 'groq';
        this.model = localStorage.getItem('jarvis_model') || 'openai/gpt-oss-120b';
        this.customModel = localStorage.getItem('jarvis_custom_model') || '';

        // UI & Audio Preferences
        this.theme = localStorage.getItem('jarvis_theme') || 'theme-cyan';
        this.scanlines = localStorage.getItem('jarvis_scanlines') !== 'false';
        this.voiceRate = parseFloat(localStorage.getItem('jarvis_voice_rate') || '1.0');
        this.voicePitch = parseFloat(localStorage.getItem('jarvis_voice_pitch') || '1.0');
        this.selectedVoiceIndex = parseInt(localStorage.getItem('jarvis_voice_index') || '0', 10);
        this.soundMuted = localStorage.getItem('jarvis_sound_muted') === 'true';

        // Load environment variables immediately
        this.applyEnvConfig();
        this.loadEnvFile();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(changeKey) {
        this.subscribers.forEach(cb => cb(changeKey, this));
    }

    applyEnvConfig() {
        const env = window.__ENV__ || {};
        if (!this.apiKey) {
            if (this.provider === 'groq' && env.GROQ_API_KEY) {
                this.apiKey = env.GROQ_API_KEY;
            } else if (this.provider === 'openai' && env.OPENAI_API_KEY) {
                this.apiKey = env.OPENAI_API_KEY;
            } else if (env.GROQ_API_KEY) {
                this.apiKey = env.GROQ_API_KEY;
                this.provider = 'groq';
            } else if (env.OPENAI_API_KEY) {
                this.apiKey = env.OPENAI_API_KEY;
                this.provider = 'openai';
            }
        }
        if (env.DEFAULT_PROVIDER && !localStorage.getItem('jarvis_provider')) {
            this.provider = env.DEFAULT_PROVIDER;
        }
        if (env.DEFAULT_MODEL && !localStorage.getItem('jarvis_model')) {
            this.model = env.DEFAULT_MODEL;
        }
        this.notify('config_loaded');
    }

    async loadEnvFile() {
        try {
            const res = await fetch('.env');
            if (res.ok) {
                const text = await res.text();
                const lines = text.split('\n');
                const parsed = {};
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx !== -1) {
                        const k = trimmed.substring(0, eqIdx).trim();
                        const v = trimmed.substring(eqIdx + 1).trim();
                        parsed[k] = v;
                    }
                }
                if (parsed.GROQ_API_KEY || parsed.OPENAI_API_KEY) {
                    window.__ENV__ = Object.assign(window.__ENV__ || {}, parsed);
                    this.applyEnvConfig();
                }
            }
        } catch (e) {
            // Environment file access fallback
        }
    }

    getApiKey() {
        if (this.apiKey) return this.apiKey;
        const env = window.__ENV__ || {};
        if (this.provider === 'groq') {
            return env.GROQ_API_KEY || this.apiKey;
        } else if (this.provider === 'openai') {
            return env.OPENAI_API_KEY || this.apiKey;
        }
        return env.GROQ_API_KEY || env.OPENAI_API_KEY || '';
    }

    getActiveModel() {
        if (this.customModel) return this.customModel;
        if (this.provider === 'groq') {
            return this.model || 'openai/gpt-oss-120b';
        } else if (this.provider === 'openai') {
            return this.model || 'gpt-4o-mini';
        } else if (this.provider === 'gemini') {
            return 'gemini-1.5-flash';
        }
        return 'Stark Offline Core';
    }

    setUserName(name) {
        this.userName = (name || 'Sir').trim();
        localStorage.setItem('jarvis_username', this.userName);
        this.notify('username_changed');
    }

    setAiConfig(apiKey, provider, model, customModel) {
        this.apiKey = (apiKey || '').trim();
        this.provider = provider || 'groq';
        this.model = model || (this.provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini');
        this.customModel = (customModel || '').trim();

        localStorage.setItem('jarvis_api_key', this.apiKey);
        localStorage.setItem('jarvis_provider', this.provider);
        localStorage.setItem('jarvis_model', this.model);
        localStorage.setItem('jarvis_custom_model', this.customModel);

        this.notify('ai_config_changed');
    }

    setTheme(themeName) {
        this.theme = themeName;
        localStorage.setItem('jarvis_theme', themeName);
        this.notify('theme_changed');
    }

    setScanlines(enabled) {
        this.scanlines = enabled;
        localStorage.setItem('jarvis_scanlines', String(enabled));
        this.notify('scanlines_changed');
    }

    setVoicePreferences(rate, pitch, voiceIndex) {
        this.voiceRate = rate;
        this.voicePitch = pitch;
        this.selectedVoiceIndex = voiceIndex;
        localStorage.setItem('jarvis_voice_rate', String(rate));
        localStorage.setItem('jarvis_voice_pitch', String(pitch));
        localStorage.setItem('jarvis_voice_index', String(voiceIndex));
        this.notify('voice_preferences_changed');
    }

    setSoundMuted(muted) {
        this.soundMuted = muted;
        localStorage.setItem('jarvis_sound_muted', String(muted));
        this.notify('sound_muted_changed');
    }

    resetDefaults() {
        localStorage.removeItem('jarvis_username');
        localStorage.removeItem('jarvis_api_key');
        localStorage.removeItem('jarvis_provider');
        localStorage.removeItem('jarvis_model');
        localStorage.removeItem('jarvis_custom_model');
        localStorage.removeItem('jarvis_theme');
        localStorage.removeItem('jarvis_scanlines');
        localStorage.removeItem('jarvis_voice_rate');
        localStorage.removeItem('jarvis_voice_pitch');
        localStorage.removeItem('jarvis_voice_index');
        localStorage.removeItem('jarvis_sound_muted');

        this.userName = 'Harsh';
        this.apiKey = '';
        this.provider = 'groq';
        this.model = 'openai/gpt-oss-120b';
        this.customModel = '';
        this.theme = 'theme-cyan';
        this.scanlines = true;
        this.voiceRate = 1.0;
        this.voicePitch = 1.0;
        this.selectedVoiceIndex = 0;
        this.soundMuted = false;

        this.applyEnvConfig();
        this.notify('reset_defaults');
    }
}
