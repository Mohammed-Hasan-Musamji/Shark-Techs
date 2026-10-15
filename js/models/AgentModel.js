/**
 * ============================================================================
 * J.A.R.V.I.S. AGENT MODEL (M - MVC)
 * Cognitive Intent Engine, Dynamic System Prompt Synthesis & Frontier LLM Gateway
 * ============================================================================
 */

class AgentModel {
    constructor(configModel, directiveModel, telemetryModel, conversationModel) {
        this.config = configModel;
        this.directives = directiveModel;
        this.telemetry = telemetryModel;
        this.conversation = conversationModel;
    }

    /**
     * Builds dynamic, context-aware system prompt injecting live HUD telemetry & directives
     */
    buildSystemPrompt() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        const battery = this.telemetry.battery;
        const batteryContext = battery.supported
            ? `${battery.level}% (${battery.charging ? 'Charging' : 'Battery'})`
            : 'Arc Reactor cell nominal (100%)';

        const pending = this.directives.getPendingTasks().map(t => t.text);
        const tasksContext = pending.length > 0 ? pending.join(' | ') : 'No pending directives';

        const activeModelName = this.config.getActiveModel();
        const providerName = this.config.provider.toUpperCase();

        return `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultra-sophisticated AI assistant originally developed by Tony Stark.
You address the user as "${this.config.userName}".
Your persona: articulate, calm, loyal, technologically brilliant, with dry British wit and subtle charm.
Keep responses concise (typically 1 to 3 impactful sentences) unless the user explicitly requests code, detailed technical analysis, or an in-depth breakdown.

[LIVE TELEMETRY PARAMETERS]:
- Current Date & Time: ${dateStr}, ${timeStr}
- System Power: ${batteryContext}
- Active Directives/Tasks: ${tasksContext}
- Uplink Model Core: ${providerName} (${activeModelName})
- Network Status: ${this.telemetry.network.online ? 'Online (Satellite Connected)' : 'Local Offline Buffer'}

You have access to this live telemetry. If the user asks about time, tasks, power, or system status, integrate this live data smoothly into your answer.`;
    }

    /**
     * Resolves direct local actions before hitting the cloud LLM
     */
    checkDirectAction(rawInput) {
        const input = rawInput.trim();
        const q = input.toLowerCase();

        // 1. Theme Matrix switching
        if (q.includes('switch theme to') || q.includes('change theme to') || q.includes('set theme to')) {
            if (q.includes('gold') || q.includes('crimson') || q.includes('red') || q.includes('mark vii')) {
                return { action: 'theme', theme: 'theme-gold', message: `Armor color matrix recalibrated to Mark VII Gold & Crimson, ${this.config.userName}.` };
            } else if (q.includes('stealth') || q.includes('green') || q.includes('emerald')) {
                return { action: 'theme', theme: 'theme-emerald', message: `Stealth Emerald luminescence activated, ${this.config.userName}. Radar cross-section minimized.` };
            } else if (q.includes('violet') || q.includes('purple') || q.includes('quantum')) {
                return { action: 'theme', theme: 'theme-violet', message: `Quantum Violet shielding spectrum engaged, ${this.config.userName}.` };
            } else if (q.includes('cyan') || q.includes('blue') || q.includes('classic') || q.includes('mark iv')) {
                return { action: 'theme', theme: 'theme-cyan', message: `Standard Mark IV Stark Cyan array restored, ${this.config.userName}.` };
            }
        }

        // 2. Defense Protocols
        if (q.includes('activate protocol') || q.includes('engage protocol') || q.includes('protocol')) {
            if (q.includes('red alert') || q.includes('emergency')) {
                return { action: 'protocol', protocol: 'red-alert', message: `RED ALERT ENGAGED. Shields at maximum output, offensive repulsors online.` };
            } else if (q.includes('house party')) {
                return { action: 'protocol', protocol: 'house-party', message: `House Party Protocol activated. All automated armor units deploying to your perimeter.` };
            } else if (q.includes('stealth')) {
                return { action: 'protocol', protocol: 'stealth', message: `Stealth protocol engaged. Acoustic dampeners active, thermal emission masked.` };
            } else if (q.includes('diagnostics') || q.includes('diagnostic')) {
                return { action: 'protocol', protocol: 'diagnostics', message: `Running comprehensive diagnostic scan across all telemetry subsystems.` };
            }
        }

        // 3. Weather Query
        if (q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('climate')) {
            return { action: 'weather', message: null };
        }

        // 4. System Status Query
        if (q === 'system status' || q === 'status report' || q === 'diagnostics' || q === 'run diagnostics') {
            const battery = this.telemetry.battery;
            const powerStr = battery.supported ? `${battery.level}% (${battery.charging ? 'Charging' : 'Discharging'})` : '100% Arc Cell';
            const uptime = this.telemetry.uptimeSeconds;
            const hrs = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);
            return {
                action: 'status',
                message: `All systems nominal, ${this.config.userName}. Core power at ${powerStr}, neural load ${this.telemetry.coreLoad}%, system uptime: ${hrs}h ${mins}m. Ready for further instructions.`
            };
        }

        // 5. Mission Directive Commands
        if (q.startsWith('add task:') || q.startsWith('add directive:') || q.startsWith('new task:')) {
            const taskText = input.replace(/^(add task:|add directive:|new task:)/i, '').trim();
            if (taskText) {
                return { action: 'add_task', text: taskText, message: `I have cataloged "${taskText}" into your active mission directives, ${this.config.userName}.` };
            }
        }

        if (q === 'show tasks' || q === 'show directives' || q === 'list tasks' || q === 'list directives') {
            const pending = this.directives.getPendingTasks();
            if (pending.length === 0) {
                return { action: 'response', message: `You have zero pending directives on your docket, ${this.config.userName}. All objectives accomplished.` };
            }
            const summary = pending.map((t, idx) => `${idx + 1}. ${t.text}`).join(' | ');
            return { action: 'response', message: `You have ${pending.length} pending directives: ${summary}.` };
        }

        if (q === 'clear tasks' || q === 'clear directives' || q === 'delete all tasks') {
            return { action: 'clear_tasks', message: `All active mission directives have been archived and cleared, ${this.config.userName}.` };
        }

        // 6. Tactical Notes Command
        if (q.startsWith('save note:') || q.startsWith('note:') || q.startsWith('record note:')) {
            const noteText = input.replace(/^(save note:|note:|record note:)/i, '').trim();
            if (noteText) {
                return { action: 'save_note', text: noteText, message: `Classified note recorded to tactical scratchpad: "${noteText}".` };
            }
        }

        // 7. Clear Conversation / Screen
        if (q === 'clear logs' || q === 'clear screen' || q === 'clear chat' || q === 'clear feed') {
            return { action: 'clear_chat', message: `Transmission feed and neural dialogue cache purged, ${this.config.userName}.` };
        }

        // 8. Math calculations
        if (q.startsWith('calculate') || q.startsWith('what is') && q.match(/[\d+\-*/^]/)) {
            const expr = q.replace(/^(calculate|what is)/i, '').replace(/[?]/g, '').trim();
            try {
                // Safe numeric evaluation
                if (/^[0-9+\-*/().\s^%]+$/.test(expr)) {
                    const sanitized = expr.replace(/\^/g, '**');
                    const res = Function(`'use strict'; return (${sanitized})`)();
                    return { action: 'response', message: `The calculation yields ${res}, ${this.config.userName}.` };
                }
            } catch (e) {
                // Fall through to LLM
            }
        }

        // 9. Web Search Uplink
        if (q.startsWith('search google for') || q.startsWith('search for') || q.startsWith('google')) {
            const target = input.replace(/^(search google for|search for|google)/i, '').trim();
            if (target) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(target)}`, '_blank');
                return { action: 'response', message: `Satellite search uplink initiated for "${target}", ${this.config.userName}. Secondary viewport opened.` };
            }
        }

        return null;
    }

    /**
     * Executes queries against Frontier LLMs (Groq LPU, OpenAI, Gemini)
     */
    async queryLLM(prompt) {
        const activeModel = this.config.getActiveModel();
        const activeKey = this.config.getApiKey();
        const provider = this.config.provider;

        if (!activeKey) {
            throw new Error(`No API key found for ${provider.toUpperCase()}. Please configure your key in Settings or .env.`);
        }

        // Construct message payload with dynamic live HUD context
        const systemMessage = { role: 'system', content: this.buildSystemPrompt() };
        const history = this.conversation.getHistory();
        const messagesPayload = [systemMessage, ...history, { role: 'user', content: prompt }];

        // 1. GROQ CLOUD INFERENCE (OpenAI-compatible high-speed endpoint)
        if (provider === 'groq') {
            const url = 'https://api.groq.com/openai/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 400
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
                throw new Error(errData.error?.message || `Groq API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No transmission returned from Groq LPU core.';
        }

        // 2. OPENAI OFFICIAL MODELS
        if (provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 400
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
                throw new Error(errData.error?.message || `OpenAI API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response returned from OpenAI core.';
        }

        // 3. GOOGLE GEMINI
        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
            const contents = messagesPayload.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Gemini API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response returned from Gemini core.';
        }

        // 4. OFFLINE HEURISTICS
        return this.queryOfflineEngine(prompt);
    }

    /**
     * Autonomous offline intelligence for standalone operation
     */
    queryOfflineEngine(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('who are you') || p.includes('what are you')) {
            return `I am J.A.R.V.I.S., Just A Rather Very Intelligent System. An autonomous AI construct engineered to manage all Stark Industries technology and assist ${this.config.userName}.`;
        }
        if (p.includes('time') || p.includes('date')) {
            const now = new Date();
            return `The current local time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, on ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`;
        }
        if (p.includes('joke')) {
            const jokes = [
                `I asked Mr. Stark if I could have a day off. He told me I could take 2 milliseconds between clock cycles.`,
                `Why did the neural network cross the road? To optimize the loss function on the other side.`,
                `My apologies, ${this.config.userName}, but my humor subroutines are strictly regulated to avoid offending the board of Stark Industries.`
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        if (p.includes('thank you') || p.includes('thanks')) {
            return `Always at your service, ${this.config.userName}. A pleasure to be of assistance.`;
        }
        return `I have processed your query: "${prompt}". To unlock expansive multi-turn reasoning, connect a Groq or OpenAI API key via the HUD settings panel, ${this.config.userName}.`;
    }

    formatErrorMessage(err) {
        const msg = err.message || '';
        if (msg.includes('401') || msg.includes('Invalid API Key') || msg.includes('Incorrect API key')) {
            return `Authentication error: The provided API key for ${this.config.provider.toUpperCase()} is invalid. Please verify your credentials in Settings or your .env file.`;
        }
        if (msg.includes('429') || msg.includes('Rate limit') || msg.includes('quota')) {
            return `Rate limit or quota exceeded on ${this.config.provider.toUpperCase()}. Please check your usage tier.`;
        }
        return `System transmission error: ${msg}`;
    }
}
