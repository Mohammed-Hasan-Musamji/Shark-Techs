/**
 * ============================================================================
 * J.A.R.V.I.S. AGENT MODEL (M - MVC)
 * Cognitive Intent Engine, Autonomous System Tool Calling & Groq LPU Gateway
 * Executes computer actions on request from both Host PC and Mobile Devices
 * ============================================================================
 */

class AgentModel {
    constructor(configModel, directiveModel, telemetryModel, conversationModel, systemBridgeModel) {
        this.config = configModel;
        this.directives = directiveModel;
        this.telemetry = telemetryModel;
        this.conversation = conversationModel;
        this.systemBridge = systemBridgeModel;
    }

    /**
     * Builds dynamic, context-aware system prompt injecting live HUD telemetry,
     * directives, real computer hardware stats and autonomous action tools
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

        // Real host system stats
        let sysContext = 'Host bridge active';
        if (this.systemBridge && this.systemBridge.systemStats) {
            const s = this.systemBridge.systemStats;
            sysContext = `Hostname: ${s.hostname}, CPU Load: ${s.cpuLoad}%, RAM: ${s.ramPercent}% used (${s.ramDetails?.used} / ${s.ramDetails?.total})`;
        }

        return `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the ultra-sophisticated AI assistant originally developed by Tony Stark.
You address the user as "${this.config.userName}".
Your persona: articulate, calm, loyal, technologically brilliant, with dry British wit and subtle charm.
Keep responses concise (typically 1 to 3 impactful sentences) unless the user explicitly requests code, detailed technical analysis, or an in-depth breakdown.

[LIVE TELEMETRY & COMPUTER HARDWARE]:
- Date & Time: ${dateStr}, ${timeStr}
- System Power: ${batteryContext}
- Active Directives/Tasks: ${tasksContext}
- Host PC Specs: ${sysContext}
- Uplink Model Core: ${providerName} (${activeModelName})

[AUTONOMOUS SYSTEM ACTIONS ON USER'S COMPUTER]:
You have direct, real-time control over the user's computer via our system bridge. The user can command you from their PC or from their mobile phone!
If the user's intent requires performing a physical computer action, include an action tag at the very end of your response:
- To launch an application: [ACTION: OPEN_APP app_name] (e.g. spotify, notepad, calc, chrome, code, explorer, taskmgr)
- To open a website/URL: [ACTION: OPEN_URL url] (e.g. https://youtube.com, https://github.com)
- To adjust volume: [ACTION: VOLUME up] or [ACTION: VOLUME down] or [ACTION: VOLUME mute] or [ACTION: VOLUME unmute]
- To take a screenshot of their PC: [ACTION: SCREENSHOT]
- To lock the workstation: [ACTION: LOCK]
- To run a terminal/powershell command: [ACTION: EXEC command]

Speak naturally and confirm the action is executing.`;
    }

    /**
     * Resolves direct local and computer system bridge actions before cloud LLM
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

        // 2. Modes & Protocols
        if (q.includes('mode') || q.includes('protocol') || q.includes('activate') || q.includes('engage')) {
            if (q.includes('focus')) {
                return { action: 'protocol', protocol: 'focus', message: `Focus Mode engaged, ${this.config.userName}. All distraction telemetry suppressed.` };
            } else if (q.includes('night') || q.includes('stealth') || q.includes('dark')) {
                return { action: 'protocol', protocol: 'stealth', message: `Night Mode active, ${this.config.userName}. Luminescence adjusted for low light.` };
            } else if (q.includes('voice') || q.includes('listen')) {
                return { action: 'protocol', protocol: 'voice-loop', message: `Voice loop mode engaged, ${this.config.userName}. Acoustic sensors listening continuously.` };
            } else if (q.includes('diagnostic')) {
                return { action: 'protocol', protocol: 'diagnostic', message: `Running comprehensive diagnostic scan on your host workstation.` };
            } else if (q.includes('red alert') || q.includes('emergency')) {
                return { action: 'protocol', protocol: 'red-alert', message: `RED ALERT ENGAGED. Shields at maximum output, offensive repulsors online.` };
            } else if (q.includes('house party')) {
                return { action: 'protocol', protocol: 'house-party', message: `House Party Protocol activated. Perimeter defense units online.` };
            }
        }

        // 3. System App Launching on Computer (Works from Phone or PC)
        if (q.startsWith('open ') || q.startsWith('launch ') || q.startsWith('start ')) {
            const target = q.replace(/^(open|launch|start)\s+/i, '').trim();

            if (target === 'spotify' || target.includes('spotify')) {
                return { action: 'bridge_app', app: 'spotify', message: `Initiating Spotify audio protocols on your host console, ${this.config.userName}.` };
            }
            if (target === 'notepad' || target === 'notes' || target.includes('notepad')) {
                return { action: 'bridge_app', app: 'notepad', message: `Launching Notepad editor on your primary display, ${this.config.userName}.` };
            }
            if (target === 'calc' || target === 'calculator' || target.includes('calculator')) {
                return { action: 'bridge_app', app: 'calc', message: `Calculator auxiliary unit deployed, ${this.config.userName}.` };
            }
            if (target === 'code' || target === 'vs code' || target === 'vscode' || target.includes('visual studio code')) {
                return { action: 'bridge_app', app: 'code', message: `VS Code development matrix initiated, ${this.config.userName}.` };
            }
            if (target === 'chrome' || target.includes('google chrome') || target === 'browser') {
                return { action: 'bridge_app', app: 'chrome', message: `Launching Google Chrome browser uplink, ${this.config.userName}.` };
            }
            if (target === 'task manager' || target === 'taskmgr') {
                return { action: 'bridge_app', app: 'taskmgr', message: `Windows Task Manager telemetry summoned to screen, ${this.config.userName}.` };
            }
            if (target === 'files' || target === 'explorer' || target.includes('file explorer')) {
                return { action: 'bridge_app', app: 'explorer', message: `Opening Windows File Explorer directory, ${this.config.userName}.` };
            }
            if (target.includes('youtube')) {
                return { action: 'bridge_url', url: 'https://youtube.com', message: `Connecting host browser directly to YouTube, ${this.config.userName}.` };
            }
            if (target.includes('github')) {
                return { action: 'bridge_url', url: 'https://github.com', message: `Opening GitHub repositories on your host console, ${this.config.userName}.` };
            }
        }

        // 4. Screenshot Capture on Computer
        if (q.includes('screenshot') || q.includes('capture screen') || q.includes('take a screenshot') || q.includes('capture display')) {
            return { action: 'bridge_screenshot', message: `Capturing desktop display buffer now, ${this.config.userName}. Transmitting image feed to your screen.` };
        }

        // 5. Volume Control on Computer
        if (q.includes('volume') || q.includes('mute') || q.includes('unmute')) {
            if (q.includes('mute') && !q.includes('unmute')) {
                return { action: 'bridge_volume', volumeAction: 'mute', message: `Host computer audio output muted, ${this.config.userName}.` };
            } else if (q.includes('unmute')) {
                return { action: 'bridge_volume', volumeAction: 'unmute', message: `Host computer audio unmuted, ${this.config.userName}.` };
            } else if (q.includes('down') || q.includes('lower') || q.includes('decrease') || q.includes('softer')) {
                return { action: 'bridge_volume', volumeAction: 'down', message: `Lowering host system volume, ${this.config.userName}.` };
            } else if (q.includes('up') || q.includes('raise') || q.includes('increase') || q.includes('louder')) {
                return { action: 'bridge_volume', volumeAction: 'up', message: `Raising host system volume, ${this.config.userName}.` };
            } else if (q.includes('max') || q.includes('100%')) {
                return { action: 'bridge_volume', volumeAction: 'max', message: `Acoustic repulsors set to maximum volume, ${this.config.userName}.` };
            }
        }

        // 6. Lock Computer / Security
        if (q.includes('lock computer') || q.includes('lock pc') || q.includes('lock workstation') || q.includes('lock screen')) {
            return { action: 'bridge_lock', message: `Locking host workstation immediately. Perimeter security engaged, ${this.config.userName}.` };
        }

        // 7. Run Terminal / PowerShell Command on Computer
        if (q.startsWith('run command ') || q.startsWith('execute ') || q.startsWith('cmd ') || q.startsWith('powershell ')) {
            const cmd = input.replace(/^(run command|execute|cmd|powershell)\s+/i, '').trim();
            if (cmd) {
                return { action: 'bridge_exec', command: cmd, message: `Executing command: "${cmd}" on host console...` };
            }
        }

        // 8. Real Hardware Stats Query
        if (q.includes('cpu') || q.includes('ram') || q.includes('hardware stats') || q.includes('pc stats') || q.includes('system status')) {
            if (this.systemBridge && this.systemBridge.systemStats) {
                const s = this.systemBridge.systemStats;
                return {
                    action: 'response',
                    message: `Host hardware diagnostic: CPU utilization at ${s.cpuLoad}%, RAM at ${s.ramPercent}% (${s.ramDetails?.used} used of ${s.ramDetails?.total}), platform ${s.hostname}. All circuits nominal, ${this.config.userName}.`
                };
            }
        }

        // 9. Weather Query
        if (q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('climate')) {
            return { action: 'weather', message: null };
        }

        // 10. Mission Directive Commands
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

        // 11. Tactical Notes Command
        if (q.startsWith('save note:') || q.startsWith('note:') || q.startsWith('record note:')) {
            const noteText = input.replace(/^(save note:|note:|record note:)/i, '').trim();
            if (noteText) {
                return { action: 'save_note', text: noteText, message: `Classified note recorded to tactical scratchpad: "${noteText}".` };
            }
        }

        // 12. Clear Conversation
        if (q === 'clear logs' || q === 'clear screen' || q === 'clear chat' || q === 'clear feed') {
            return { action: 'clear_chat', message: `Transmission feed and neural dialogue cache purged, ${this.config.userName}.` };
        }

        // 13. Math calculations
        if (q.startsWith('calculate') || q.startsWith('what is') && q.match(/[\d+\-*/^]/)) {
            const expr = q.replace(/^(calculate|what is)/i, '').replace(/[?]/g, '').trim();
            try {
                if (/^[0-9+\-*/().\s^%]+$/.test(expr)) {
                    const sanitized = expr.replace(/\^/g, '**');
                    const res = Function(`'use strict'; return (${sanitized})`)();
                    return { action: 'response', message: `The calculation yields ${res}, ${this.config.userName}.` };
                }
            } catch (e) {}
        }

        // 14. Web Search Uplink
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

        const systemMessage = { role: 'system', content: this.buildSystemPrompt() };
        const history = this.conversation.getHistory();
        const messagesPayload = [systemMessage, ...history, { role: 'user', content: prompt }];

        let rawResponse = '';

        // 1. GROQ CLOUD INFERENCE
        if (provider === 'groq') {
            const url = 'https://api.groq.com/openai/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 450
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
            rawResponse = data.choices?.[0]?.message?.content || 'No transmission returned from Groq LPU core.';
        } else if (provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 450
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
            rawResponse = data.choices?.[0]?.message?.content || 'No response returned from OpenAI core.';
        } else {
            rawResponse = this.queryOfflineEngine(prompt);
        }

        // Process autonomous tool action tags embedded by the LLM
        return await this.executeAutonomousToolTags(rawResponse);
    }

    /**
     * Inspects LLM response for [ACTION: ...] tags and executes them on the PC
     */
    async executeAutonomousToolTags(response) {
        if (!response || !this.systemBridge) return response;

        // Match [ACTION: TYPE param]
        const actionRegex = /\[ACTION:\s*([A-Z_]+)(?:\s+(.*?))?\]/i;
        const match = response.match(actionRegex);

        if (!match) return response;

        const actionType = match[1].toUpperCase();
        const actionParam = (match[2] || '').trim();

        // Strip action tag for vocal cleanliness
        let cleanText = response.replace(actionRegex, '').trim();

        try {
            if (actionType === 'OPEN_APP') {
                await this.systemBridge.openApp(actionParam);
                this.telemetry.appendLog(`[ACTION] Autonomous launch executed: ${actionParam}`);
            } else if (actionType === 'OPEN_URL') {
                await this.systemBridge.openUrl(actionParam);
                this.telemetry.appendLog(`[ACTION] Autonomous web navigation: ${actionParam}`);
            } else if (actionType === 'VOLUME') {
                await this.systemBridge.controlVolume(actionParam);
                this.telemetry.appendLog(`[ACTION] Autonomous volume adjustment: ${actionParam}`);
            } else if (actionType === 'SCREENSHOT') {
                await this.systemBridge.captureScreenshot();
                this.telemetry.appendLog(`[ACTION] Autonomous screenshot acquired.`);
            } else if (actionType === 'LOCK') {
                await this.systemBridge.lockWorkstation();
                this.telemetry.appendLog(`[ACTION] Autonomous workstation lock initiated.`);
            } else if (actionType === 'EXEC') {
                const execResult = await this.systemBridge.executeTerminal(actionParam);
                this.telemetry.appendLog(`[ACTION] Executed terminal command: ${actionParam}`);
                if (execResult.stdout) {
                    cleanText += `\n\nTerminal Output:\n\`\`\`powershell\n${execResult.stdout.substring(0, 300)}\n\`\`\``;
                }
            }
        } catch (err) {
            console.warn('Action execution caught error:', err);
        }

        return cleanText;
    }

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
                `Why did the neural network cross the road? To optimize the loss function on the other side.`
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        return `I have processed your query: "${prompt}". Connected to your host computer and mobile satellite uplink.`;
    }

    formatErrorMessage(err) {
        const msg = err.message || '';
        if (msg.includes('401') || msg.includes('Invalid API Key')) {
            return `Authentication error: The provided API key is invalid. Please verify your credentials.`;
        }
        if (msg.includes('429') || msg.includes('Rate limit')) {
            return `Rate limit exceeded on Groq LPU. Please wait a moment before sending another prompt.`;
        }
        return `System transmission error: ${msg}`;
    }
}
