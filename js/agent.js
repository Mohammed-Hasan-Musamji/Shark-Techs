/**
 * ============================================================================
 * J.A.R.V.I.S. COGNITIVE AI AGENT ENGINE
 * Natural Language Understanding, Autonomous Skills, Memory & LLM Gateway
 * ============================================================================
 */

class JarvisAIAgent {
    constructor() {
        this.userName = localStorage.getItem('jarvis_username') || 'Sir';
        this.apiKey = localStorage.getItem('jarvis_api_key') || '';
        this.provider = localStorage.getItem('jarvis_provider') || 'builtin';
        
        // System Prompt for J.A.R.V.I.S. Persona
        this.systemPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultra-sophisticated AI created by Tony Stark.
You address the user as "${this.userName}".
Your tone is refined, articulate, calm, loyal, slightly witty, and technologically brilliant.
Always respond in 1 to 3 concise, impactful sentences unless detailed technical analysis is explicitly requested.`;
    }

    setUserName(name) {
        this.userName = name || 'Sir';
        localStorage.setItem('jarvis_username', this.userName);
    }

    setApiKey(key, provider) {
        this.apiKey = key || '';
        this.provider = provider || 'builtin';
        localStorage.setItem('jarvis_api_key', this.apiKey);
        localStorage.setItem('jarvis_provider', this.provider);
    }

    /**
     * Entry Point: Handle user command (via voice or typed text)
     */
    async handleCommand(rawInput) {
        const input = rawInput.trim();
        if (!input) return;

        // Display user's command in the stream
        this.appendMessage('user', input);

        // Sound effect
        if (window.jarvisSound) window.jarvisSound.playClick();
        if (window.jarvisVisualizer) window.jarvisVisualizer.setState('processing');

        // Check if command matches internal offline skills first
        const internalResult = await this.executeInternalSkills(input);
        
        if (internalResult) {
            this.deliverResponse(internalResult);
            return;
        }

        // If no direct skill matched, check if LLM API is configured
        if (this.apiKey && this.provider !== 'builtin') {
            try {
                this.appendTelemetryLog(`Routing query to ${this.provider.toUpperCase()} LLM Core...`);
                const llmReply = await this.queryLLM(input);
                this.deliverResponse(llmReply);
                return;
            } catch (err) {
                console.warn('LLM Core Error:', err);
                this.appendTelemetryLog(`LLM error: ${err.message}. Falling back to internal heuristics.`);
            }
        }

        // Default Intelligent Fallback Heuristic
        const fallbackReply = this.generateFallbackResponse(input);
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
     * Built-in Autonomous Skills & Natural Intent Parser
     */
    async executeInternalSkills(query) {
        const q = query.toLowerCase();

        // 1. Time & Date
        if (q.includes('time') || q.includes('what time is it') || q.includes('current time')) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `The current time is ${timeStr}, ${this.userName}. All chronometers remain synchronized with Greenwich Mean Time.`;
        }

        if (q.includes('date') || q.includes('what day is it') || q.includes('what is today')) {
            const now = new Date();
            const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return `Today is ${dateStr}, ${this.userName}.`;
        }

        // 2. Weather & Atmospheric Conditions
        if (q.includes('weather') || q.includes('temperature') || q.includes('climate') || q.includes('forecast')) {
            return await this.fetchLiveWeather();
        }

        // 3. System Diagnostics & Telemetry
        if (q.includes('system status') || q.includes('diagnostics') || q.includes('system report') || q.includes('status report')) {
            return this.runSystemScan();
        }

        // 4. Task Management
        if (q.startsWith('add task') || q.startsWith('new task') || q.startsWith('remember to') || q.includes('add directive')) {
            let taskText = query.replace(/^(add task|new task|remember to|add directive):?/i, '').trim();
            if (!taskText) taskText = 'Review Stark Industries protocol';
            if (window.jarvisApp) {
                window.jarvisApp.addTask(taskText);
            }
            return `I have logged "${taskText}" into your active mission directives, ${this.userName}.`;
        }

        if (q.includes('show task') || q.includes('list task') || q.includes('show directives')) {
            const tasks = JSON.parse(localStorage.getItem('jarvis_tasks') || '[]');
            if (tasks.length === 0) {
                return `Your mission directives queue is currently clear, ${this.userName}.`;
            }
            const pending = tasks.filter(t => !t.completed).map(t => t.text).join('; ');
            return `You have ${tasks.length} active directives on record. Pending items: ${pending || 'None'}.`;
        }

        if (q.includes('clear task') || q.includes('delete all tasks')) {
            if (window.jarvisApp) window.jarvisApp.clearTasks();
            return `All mission directives have been archived and cleared, ${this.userName}.`;
        }

        // 5. Tactical Notes / Scratchpad
        if (q.startsWith('note') || q.startsWith('write note') || q.startsWith('save note')) {
            const noteText = query.replace(/^(note|write note|save note):?/i, '').trim();
            if (window.jarvisApp) {
                window.jarvisApp.appendNote(noteText);
            }
            return `Note securely filed in the tactical scratchpad, ${this.userName}.`;
        }

        // 6. Protocols & Defense
        if (q.includes('protocol') || q.includes('house party') || q.includes('stealth mode') || q.includes('red alert')) {
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
                return `House Party protocol authorized. Dispersing autonomous Iron Legion units to your location.`;
            }
            return `Protocol ${proto} engaged successfully, ${this.userName}.`;
        }

        // 7. Armor Theme Switcher
        if (q.includes('theme') || q.includes('armor') || q.includes('suit')) {
            if (q.includes('gold') || q.includes('mark 7') || q.includes('red')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-gold');
                return `Switching HUD to Mark VII Gold & Crimson armor configuration.`;
            } else if (q.includes('emerald') || q.includes('green')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-emerald');
                return `Activating Stealth Emerald tactical display.`;
            } else if (q.includes('violet') || q.includes('purple')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-violet');
                return `Switching to Quantum Violet deep-spectrum HUD.`;
            } else if (q.includes('cyan') || q.includes('blue') || q.includes('default')) {
                if (window.jarvisApp) window.jarvisApp.setTheme('theme-cyan');
                return `Reverting HUD to Mark IV Stark Blue.`;
            }
        }

        // 8. Mathematical Calculations
        if (q.includes('calculate') || q.includes('what is') && /[\d+\-*/%]/.test(q)) {
            const mathMatch = q.replace(/calculate|what is/g, '').replace(/times/g, '*').replace(/divided by/g, '/').replace(/plus/g, '+').replace(/minus/g, '-').trim();
            try {
                // Safe numeric evaluation
                if (/^[\d\s+\-*/().%]+$/.test(mathMatch)) {
                    // eslint-disable-next-line no-eval
                    const res = Function(`'use strict'; return (${mathMatch})`)();
                    return `Computation complete: ${mathMatch} equals ${res}.`;
                }
            } catch (e) {
                // ignore math parse error
            }
        }

        // 9. Web Search
        if (q.startsWith('search google for') || q.startsWith('search for') || q.startsWith('google')) {
            const searchTarget = query.replace(/^(search google for|search for|google)/i, '').trim();
            if (searchTarget) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTarget)}`, '_blank');
                return `Executing satellite uplink for "${searchTarget}". Uplink opened in secondary monitor.`;
            }
        }

        // 10. Stark Lore & Personality Easter Eggs
        if (q.includes('who are you') || q.includes('what are you')) {
            return `I am J.A.R.V.I.S., your Just A Rather Very Intelligent System. I run Stark Industries cybernetics, telemetry, tactical computing, and your daily schedule.`;
        }

        if (q.includes('where is tony') || q.includes('tony stark')) {
            return `Mr. Stark is currently in the workshop fine-tuning the Mark 85 nanotech thrusters, ${this.userName}.`;
        }

        if (q.includes('tell me a joke') || q.includes('joke')) {
            const jokes = [
                `Why did Ultron fail to take over the world? He forgot to install Windows security updates before attempting global domination.`,
                `I asked Mr. Stark if my processor was running too fast. He said, 'Jarvis, speed is a feature, not a bug.'`,
                `There are 10 types of people in the multiverse: those who understand binary, and those who get incinerated by repulsors.`
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        if (q.includes('i am iron man') || q.includes('iron man')) {
            if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
            return `And I am J.A.R.V.I.S., at your command always, Sir.`;
        }

        if (q.includes('hello') || q.includes('hey jarvis') || q.includes('hi')) {
            return `Greetings, ${this.userName}. Sensors are green across the board. What are your orders?`;
        }

        if (q.includes('clear log') || q.includes('clear screen') || q.includes('clear chat')) {
            if (window.jarvisApp) window.jarvisApp.clearConversation();
            return `Transmission feed cleared. Standing by.`;
        }

        // No direct internal match found
        return null;
    }

    /**
     * Run full hardware and telemetry diagnostics
     */
    runSystemScan() {
        let batteryStr = 'Battery sensor unavailable';
        if (window.jarvisApp && window.jarvisApp.batteryInfo) {
            batteryStr = `Power cells at ${window.jarvisApp.batteryInfo.level}%, ${window.jarvisApp.batteryInfo.charging ? 'Charging' : 'Discharging'}`;
        }
        const netStr = navigator.onLine ? 'Network uplink online' : 'Operating in localized offline mode';
        const resolution = `${window.screen.width}x${window.screen.height} px`;
        
        return `Diagnostic Complete, ${this.userName}. Arc Core output: 98.4% nominal. ${batteryStr}. ${netStr}. HUD resolution: ${resolution}. All subsystems operating without malfunction.`;
    }

    /**
     * Fetch Live Weather from Open-Meteo API
     */
    async fetchLiveWeather() {
        try {
            this.appendTelemetryLog('Probing atmospheric satellite sensors...');
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.0259&longitude=-118.7798&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius');
            if (!res.ok) throw new Error('Sensor telemetry timeout');
            const data = await res.json();
            const temp = Math.round(data.current.temperature_2m);
            const humidity = data.current.relative_humidity_2m;
            const wind = Math.round(data.current.wind_speed_10m);

            // Update weather widget directly
            const tempEl = document.getElementById('weatherTemp');
            const descEl = document.getElementById('weatherDesc');
            if (tempEl) tempEl.textContent = `${temp}°C`;
            if (descEl) descEl.textContent = `Humidity: ${humidity}% | Wind: ${wind} km/h. Flight conditions optimal.`;

            return `Atmospheric scan results: Current temperature is ${temp} degrees Celsius with ${humidity}% humidity and wind speeds of ${wind} kilometers per hour. Optimal flight conditions, ${this.userName}.`;
        } catch (e) {
            return `Atmospheric sensors indicate clear skies, 22°C with light westerly winds at Malibu Point, ${this.userName}. Flight conditions remain ideal.`;
        }
    }

    /**
     * Frontier LLM Query (Gemini or OpenAI)
     */
    async queryLLM(prompt) {
        if (this.provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
            const body = {
                contents: [{
                    parts: [
                        { text: `${this.systemPrompt}\nUser says: ${prompt}` }
                    ]
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `Gemini API response code: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No verbal response generated by Gemini core.';
        } else if (this.provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const body = {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `OpenAI API response code: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response from OpenAI core.';
        }

        throw new Error('Unsupported LLM provider');
    }

    generateFallbackResponse(input) {
        const responses = [
            `Analysis indicates the following regarding "${input}": all protocols are evaluating the parameters. How would you like me to proceed, ${this.userName}?`,
            `Command registered, ${this.userName}. I have correlated your inquiry against our tactical database. Systems stand ready.`,
            `Right away, ${this.userName}. Processing your request for "${input}". Should I allocate additional neural cores to this directive?`,
            `Understood, ${this.userName}. The telemetry for this directive has been logged to your mission briefing.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
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
