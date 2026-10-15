/**
 * ============================================================================
 * J.A.R.V.I.S. COGNITIVE AI AGENT ENGINE
 * Groq LPU Core & OpenAI Models Gateway, Autonomous Skills & Multi-Turn Memory
 * ============================================================================
 */

class JarvisAIAgent {
    constructor() {
        this.userName = localStorage.getItem('jarvis_username') || 'Sir';
        this.apiKey = localStorage.getItem('jarvis_api_key') || '';
        this.provider = localStorage.getItem('jarvis_provider') || 'groq';
        
        let storedModel = localStorage.getItem('jarvis_model') || '';
        if (!storedModel || storedModel.toLowerCase().includes('llama')) {
            storedModel = 'openai/gpt-oss-120b';
            localStorage.setItem('jarvis_model', storedModel);
        }
        this.model = storedModel;
        this.customModel = localStorage.getItem('jarvis_custom_model') || '';

        // Multi-Turn Conversation Memory Buffer (last 12 turns)
        this.conversationHistory = [];
        this.maxHistory = 12;

        // Apply environment variables from window.__ENV__ if present
        this.applyEnvConfig();

        // Also attempt to fetch .env asynchronously to parse dynamic updates
        this.loadEnvFile();

        this.updateHeaderPill();
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
        this.updateHeaderPill();
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
                    this.appendTelemetryLog(`[ENV] Environment parameters loaded from .env file (${this.provider.toUpperCase()} active).`);
                }
            }
        } catch (e) {
            // Static file or fetch restrictions fallback
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

    setUserName(name) {
        this.userName = name || 'Sir';
        localStorage.setItem('jarvis_username', this.userName);
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

        this.updateHeaderPill();
    }

    getActiveModel() {
        if (this.customModel) return this.customModel;
        if (this.provider === 'groq') {
            if (!this.model || this.model.toLowerCase().includes('llama')) {
                this.model = 'openai/gpt-oss-120b';
                localStorage.setItem('jarvis_model', this.model);
            }
            return this.model;
        } else if (this.provider === 'openai') {
            return this.model || 'gpt-4o-mini';
        } else if (this.provider === 'gemini') {
            return 'gemini-1.5-flash';
        }
        return 'Stark Offline Core';
    }

    updateHeaderPill() {
        const pill = document.getElementById('btnAiCoreStatus');
        const label = document.getElementById('aiCoreLabel');
        if (!pill || !label) return;

        pill.classList.remove('active-groq', 'active-openai');

        const activeKey = this.getApiKey();
        if (!activeKey && this.provider !== 'builtin') {
            label.textContent = 'CONNECT API KEY';
            pill.title = 'Click to connect your Groq or OpenAI API key';
            return;
        }

        if (this.provider === 'groq') {
            pill.classList.add('active-groq');
            const rawModel = this.getActiveModel();
            const modelName = rawModel.replace('openai/', '').toUpperCase();
            label.textContent = `GROQ: ${modelName}`;
            pill.title = `Active Core: Groq LPU (${this.getActiveModel()})`;
        } else if (this.provider === 'openai') {
            pill.classList.add('active-openai');
            label.textContent = `OPENAI: ${this.getActiveModel().toUpperCase()}`;
            pill.title = `Active Core: OpenAI Official (${this.getActiveModel()})`;
        } else if (this.provider === 'gemini') {
            label.textContent = 'GEMINI: 1.5-FLASH';
            pill.title = 'Active Core: Google Gemini 1.5 Flash';
        } else {
            label.textContent = 'STARK OFFLINE';
            pill.title = 'Operating on local heuristic knowledge engine';
        }
    }

    /**
     * Builds dynamic, context-aware system prompt injecting live HUD telemetry & directives
     */
    buildSystemPrompt() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        let batteryContext = 'Arc Reactor cell nominal';
        if (window.jarvisApp && window.jarvisApp.batteryInfo) {
            batteryContext = `${window.jarvisApp.batteryInfo.level}% (${window.jarvisApp.batteryInfo.charging ? 'Charging' : 'Battery'})`;
        }

        let tasksContext = 'None';
        const storedTasks = JSON.parse(localStorage.getItem('jarvis_tasks') || '[]');
        const pending = storedTasks.filter(t => !t.completed).map(t => t.text);
        if (pending.length > 0) {
            tasksContext = pending.join(' | ');
        }

        const activeModelName = this.getActiveModel();

        return `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultra-sophisticated AI assistant originally developed by Tony Stark.
You address the user as "${this.userName}".
Your persona: articulate, calm, loyal, technologically brilliant, with dry British wit and subtle charm.
Keep responses concise (typically 1 to 3 impactful sentences) unless the user explicitly requests code, detailed technical analysis, or an in-depth breakdown.

[LIVE TELEMETRY PARAMETERS]:
- Current Date & Time: ${dateStr}, ${timeStr}
- System Power: ${batteryContext}
- Active Directives/Tasks: ${tasksContext}
- Uplink Model Core: ${this.provider.toUpperCase()} (${activeModelName})

You have access to this live telemetry. If the user asks about time, tasks, or system status, integrate this live data smoothly into your answer.`;
    }

    /**
     * Entry Point: Handle user command (via voice or typed text)
     */
    async handleCommand(rawInput) {
        const input = rawInput.trim();
        if (!input) return;

        // Display user's command in the conversation stream
        this.appendMessage('user', input);

        // Sound effect & visualizer state
        if (window.jarvisSound) window.jarvisSound.playClick();
        if (window.jarvisVisualizer) window.jarvisVisualizer.setState('processing');

        // Check if command is a strict DOM/hardware action (theme change, task addition, mute, protocols)
        const directAction = this.handleDirectUiActions(input);
        if (directAction) {
            this.deliverResponse(directAction);
            return;
        }

        // If an LLM provider is configured with an API key (from .env or UI), route prompts to the model!
        const activeKey = this.getApiKey();
        if (activeKey && this.provider !== 'builtin') {
            try {
                this.appendTelemetryLog(`Routing prompt to ${this.provider.toUpperCase()} (${this.getActiveModel()})...`);
                const llmReply = await this.queryLLM(input);
                this.deliverResponse(llmReply);
                return;
            } catch (err) {
                console.warn('LLM Core Execution Error:', err);
                this.appendTelemetryLog(`[ERR] ${this.provider.toUpperCase()}: ${err.message}`);

                // Deliver informative error to the user
                const errorHelp = this.formatLlmErrorMessage(err);
                this.deliverResponse(errorHelp);
                return;
            }
        }

        // If no API key is set, use the built-in offline NLP engine
        const fallbackReply = await this.executeInternalOfflineEngine(input);
        this.deliverResponse(fallbackReply);
    }

    deliverResponse(text) {
        if (window.jarvisSound) window.jarvisSound.playProcessComplete();
        this.appendMessage('jarvis', text);
        if (window.jarvisSpeech) {
            window.jarvisSpeech.speak(text);
        }
    }

    /**
     * Handles direct hardware and DOM manipulation actions (themes, clearing, tasks, protocols)
     */
    handleDirectUiActions(query) {
        const q = query.toLowerCase();

        // Theme switching
        if (q.includes('theme') || q.includes('armor suit') || q.includes('suit color')) {
            if (q.includes('gold') || q.includes('mark 7') || q.includes('crimson') || q.includes('red')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-gold');
                return `Recalibrating HUD to Mark VII Gold & Crimson armor configuration, ${this.userName}.`;
            } else if (q.includes('emerald') || q.includes('green') || q.includes('stealth armor')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-emerald');
                return `Engaging Stealth Emerald visual frequencies, ${this.userName}.`;
            } else if (q.includes('violet') || q.includes('purple') || q.includes('quantum')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-violet');
                return `Quantum Violet deep-spectrum HUD activated, ${this.userName}.`;
            } else if (q.includes('cyan') || q.includes('blue') || q.includes('default') || q.includes('mark 4')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-cyan');
                return `Reverting HUD to standard Mark IV Stark Cyan, ${this.userName}.`;
            }
        }

        // Protocols
        if (q.startsWith('activate protocol') || q.startsWith('engage protocol')) {
            let proto = 'house-party';
            if (q.includes('stealth')) proto = 'stealth';
            if (q.includes('red alert') || q.includes('alert')) proto = 'red-alert';
            if (q.includes('diagnostic')) proto = 'diagnostic';

            if (window.jarvisApp) window.jarvisApp.engageProtocol(proto);
            if (proto === 'red-alert') {
                return `Red Alert engaged! Defense shields at maximum. Auxiliary repulsors standing by!`;
            } else if (proto === 'stealth') {
                return `Stealth protocol active. Radar cross-section minimized, thermal signatures dampened.`;
            } else if (proto === 'house-party') {
                return `House Party protocol authorized. Dispersing autonomous Iron Legion units.`;
            }
            return `Protocol ${proto} engaged successfully, ${this.userName}.`;
        }

        // Add task directly
        if (q.startsWith('add task') || q.startsWith('new task') || q.startsWith('remember to') || q.startsWith('add directive')) {
            let taskText = query.replace(/^(add task|new task|remember to|add directive):?/i, '').trim();
            if (!taskText) taskText = 'Review Stark Industries parameters';
            if (window.jarvisApp) {
                window.jarvisApp.addTask(taskText);
            }
            return `I have cataloged "${taskText}" into your active mission directives, ${this.userName}.`;
        }

        // Clear directives
        if (q === 'clear tasks' || q === 'clear directives' || q === 'delete all tasks') {
            if (window.jarvisApp) window.jarvisApp.clearTasks();
            return `All active mission directives have been archived and cleared, ${this.userName}.`;
        }

        // Clear screen / conversation
        if (q === 'clear logs' || q === 'clear screen' || q === 'clear chat' || q === 'clear feed') {
            if (window.jarvisApp) window.jarvisApp.clearConversation();
            this.conversationHistory = [];
            return `Transmission feed and neural dialogue cache purged, ${this.userName}.`;
        }

        // Web search uplink
        if (q.startsWith('search google for') || q.startsWith('search for') || q.startsWith('google')) {
            const searchTarget = query.replace(/^(search google for|search for|google)/i, '').trim();
            if (searchTarget) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTarget)}`, '_blank');
                return `Satellite search uplink initiated for "${searchTarget}", ${this.userName}. Secondary viewport opened.`;
            }
        }

        return null;
    }

    /**
     * Frontier LLM Query (Supports Groq LPU, OpenAI Official, and Gemini)
     */
    async queryLLM(prompt) {
        const activeModel = this.getActiveModel();
        const activeKey = this.getApiKey();

        if (!activeKey) {
            throw new Error(`No API key found for ${this.provider.toUpperCase()}. Please add it to your .env file or Settings modal.`);
        }

        // Append user prompt to multi-turn conversation history
        this.conversationHistory.push({ role: 'user', content: prompt });
        if (this.conversationHistory.length > this.maxHistory) {
            this.conversationHistory.shift();
        }

        // System prompt with live HUD parameters
        const systemMessage = { role: 'system', content: this.buildSystemPrompt() };
        const messagesPayload = [systemMessage, ...this.conversationHistory];

        let responseText = '';

        // 1. GROQ CLOUD (Ultra-Fast Inference - OpenAI Compatible Endpoint)
        if (this.provider === 'groq') {
            const url = 'https://api.groq.com/openai/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 350
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Groq API responded with HTTP ${response.status}`);
            }

            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content || 'No response returned from Groq LPU core.';
        }

        // 2. OPENAI OFFICIAL (GPT-4o, GPT-4o-Mini)
        else if (this.provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 350
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `OpenAI API responded with HTTP ${response.status}`);
            }

            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content || 'No response returned from OpenAI core.';
        }

        // 3. GOOGLE GEMINI
        else if (this.provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
            const body = {
                contents: [
                    {
                        parts: [
                            { text: `${this.buildSystemPrompt()}\n\nUser Prompt: ${prompt}` }
                        ]
                    }
                ]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Gemini API responded with HTTP ${response.status}`);
            }

            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No verbal response generated by Gemini core.';
        }

        // Cache assistant response in conversation history
        this.conversationHistory.push({ role: 'assistant', content: responseText });
        if (this.conversationHistory.length > this.maxHistory) {
            this.conversationHistory.shift();
        }

        return responseText;
    }

    formatLlmErrorMessage(err) {
        const msg = err.message || '';
        if (msg.includes('401') || msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('unauthorized')) {
            return `Authentication failure: The provided ${this.provider.toUpperCase()} API key appears invalid or expired. Please check your credentials in the AI Core settings.`;
        }
        if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
            return `Bandwidth limit reached: The ${this.provider.toUpperCase()} API rate limit or quota has been exceeded for this key.`;
        }
        if (msg.includes('model_not_found') || msg.toLowerCase().includes('does not exist')) {
            return `Model configuration error: The model "${this.getActiveModel()}" was not recognized by ${this.provider.toUpperCase()}. Please check your model identifier.`;
        }
        return `Core uplink anomaly with ${this.provider.toUpperCase()}: ${msg}. Reverting to local auxiliary systems.`;
    }

    /**
     * Built-in Offline Fallback Engine (when no API key is provided)
     */
    async executeInternalOfflineEngine(query) {
        const q = query.toLowerCase();

        // Time / Date
        if (q.includes('time') || q.includes('what time is it')) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `The current time is ${timeStr}, ${this.userName}. All chronometers remain synchronized with Greenwich Mean Time.`;
        }

        if (q.includes('date') || q.includes('what day is it')) {
            const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return `Today is ${dateStr}, ${this.userName}.`;
        }

        // Weather
        if (q.includes('weather') || q.includes('temperature') || q.includes('climate') || q.includes('forecast')) {
            return await this.fetchLiveWeather();
        }

        // Diagnostics
        if (q.includes('system status') || q.includes('diagnostics') || q.includes('status report')) {
            return this.runSystemScan();
        }

        // Tasks query
        if (q.includes('show task') || q.includes('list task') || q.includes('show directives')) {
            const tasks = JSON.parse(localStorage.getItem('jarvis_tasks') || '[]');
            if (tasks.length === 0) return `Your mission directives queue is currently clear, ${this.userName}.`;
            const pending = tasks.filter(t => !t.completed).map(t => t.text).join('; ');
            return `You have ${tasks.length} directives logged. Pending: ${pending || 'None'}.`;
        }

        // Math
        if (q.includes('calculate') || (q.includes('what is') && /[\d+\-*/%]/.test(q))) {
            const mathMatch = q.replace(/calculate|what is/g, '').replace(/times/g, '*').replace(/divided by/g, '/').replace(/plus/g, '+').replace(/minus/g, '-').trim();
            try {
                if (/^[\d\s+\-*/().%]+$/.test(mathMatch)) {
                    // eslint-disable-next-line no-eval
                    const res = Function(`'use strict'; return (${mathMatch})`)();
                    return `Computation complete: ${mathMatch} evaluates to ${res}, ${this.userName}.`;
                }
            } catch (e) { }
        }

        // Lore
        if (q.includes('who are you') || q.includes('what are you')) {
            return `I am J.A.R.V.I.S., your Just A Rather Very Intelligent System. Connect your Groq or OpenAI API key in the top bar to unlock my full conversational intelligence.`;
        }

        if (q.includes('where is tony') || q.includes('tony stark')) {
            return `Mr. Stark is currently in the workshop fine-tuning nanotech thrusters, ${this.userName}.`;
        }

        if (q.includes('tell me a joke') || q.includes('joke')) {
            const jokes = [
                `Why did Ultron fail to conquer Earth? He forgot to install Windows security patches before attempting world domination.`,
                `I asked Mr. Stark if my processor was running too fast. He said, 'Speed is a feature, Jarvis, never a bug.'`,
                `There are 10 types of people in the multiverse: those who understand binary, and those who get incinerated by repulsors.`
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        return `Prompt received: "${query}". To unlock uninhibited frontier reasoning, connect your Groq API key (or OpenAI key) via the AI Core button in the header.`;
    }

    /**
     * Atmospheric scan via Open-Meteo
     */
    async fetchLiveWeather() {
        try {
            this.appendTelemetryLog('Probing atmospheric satellite sensors...');
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.0259&longitude=-118.7798&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=celsius');
            if (!res.ok) throw new Error('Sensor telemetry timeout');
            const data = await res.json();
            const temp = Math.round(data.current.temperature_2m);
            const humidity = data.current.relative_humidity_2m;
            const wind = Math.round(data.current.wind_speed_10m);

            const tempEl = document.getElementById('weatherTemp');
            const descEl = document.getElementById('weatherDesc');
            if (tempEl) tempEl.textContent = `${temp}°C`;
            if (descEl) descEl.textContent = `Humidity: ${humidity}% | Wind: ${wind} km/h. Flight conditions optimal.`;

            return `Atmospheric scan results: Current temperature is ${temp}°C with ${humidity}% humidity and ${wind} km/h winds. Optimal flight conditions, ${this.userName}.`;
        } catch (e) {
            return `Atmospheric sensors indicate clear skies, 22°C with light westerly winds at Malibu Point, ${this.userName}. Flight conditions remain ideal.`;
        }
    }

    /**
     * Hardware diagnostics
     */
    runSystemScan() {
        let batteryStr = 'Battery sensor unavailable';
        if (window.jarvisApp && window.jarvisApp.batteryInfo) {
            batteryStr = `Power cells at ${window.jarvisApp.batteryInfo.level}%, ${window.jarvisApp.batteryInfo.charging ? 'Charging' : 'Discharging'}`;
        }
        const netStr = navigator.onLine ? 'Network uplink online' : 'Operating in localized offline mode';
        const resolution = `${window.screen.width}x${window.screen.height} px`;
        const activeCore = `${this.provider.toUpperCase()} (${this.getActiveModel()})`;

        return `Diagnostic Complete, ${this.userName}. Neural Core: ${activeCore}. ${batteryStr}. ${netStr}. HUD resolution: ${resolution}. All subsystems operating nominally.`;
    }

    appendMessage(sender, text) {
        const stream = document.getElementById('conversationStream');
        if (!stream) return;

        const entry = document.createElement('div');
        entry.className = `message-entry ${sender === 'jarvis' ? 'jarvis-msg' : 'user-msg'}`;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        entry.innerHTML = `
            <div class="msg-avatar">${sender === 'jarvis' ? 'J' : 'U'}</div>
            <div class="msg-content">
                <div class="msg-sender">${sender === 'jarvis' ? 'J.A.R.V.I.S.' : this.userName} <span class="msg-time">${timeStr}</span></div>
                <div class="msg-body">${this.escapeHTML(text)}</div>
            </div>
        `;

        stream.appendChild(entry);
        stream.scrollTop = stream.scrollHeight;
    }

    appendTelemetryLog(text) {
        const logStream = document.getElementById('telemetryLogs');
        if (!logStream) return;

        const row = document.createElement('div');
        row.className = 'log-row';
        const now = new Date();
        const timeStr = `[${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]`;
        row.innerHTML = `<span class="log-time">${timeStr}</span> ${this.escapeHTML(text)}`;
        logStream.appendChild(row);
        logStream.scrollTop = logStream.scrollHeight;
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

// Global Agent Instance
window.jarvisAgent = new JarvisAIAgent();
