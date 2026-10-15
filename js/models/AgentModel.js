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

        // 2. Modes & Protocols (English & Chinese)
        if (q.includes('mode') || q.includes('protocol') || q.includes('activate') || q.includes('engage') || q.includes('模式') || q.includes('协议')) {
            if (q.includes('focus') || q.includes('专注')) {
                return { action: 'protocol', protocol: 'focus', message: `Focus Mode engaged, ${this.config.userName}. All distraction telemetry suppressed.` };
            } else if (q.includes('night') || q.includes('stealth') || q.includes('dark') || q.includes('夜间') || q.includes('隐身')) {
                return { action: 'protocol', protocol: 'stealth', message: `Night Mode active, ${this.config.userName}. Luminescence adjusted for low light.` };
            } else if (q.includes('voice') || q.includes('listen') || q.includes('语音')) {
                return { action: 'protocol', protocol: 'voice-loop', message: `Voice loop mode engaged, ${this.config.userName}. Acoustic sensors listening continuously.` };
            } else if (q.includes('diagnostic') || q.includes('诊断')) {
                return { action: 'protocol', protocol: 'diagnostic', message: `Running comprehensive diagnostic scan on your host workstation.` };
            } else if (q.includes('red alert') || q.includes('emergency') || q.includes('红色警报')) {
                return { action: 'protocol', protocol: 'red-alert', message: `RED ALERT ENGAGED. Shields at maximum output, offensive repulsors online.` };
            } else if (q.includes('house party')) {
                return { action: 'protocol', protocol: 'house-party', message: `House Party Protocol activated. Perimeter defense units online.` };
            }
        }

        // 3. Application Dictation, Web Search & Interactive System Launching

        // A. Notepad Writing & Note Dictation (e.g., "hello open Notepad and write hi Janvi and hi Harsh")
        const notepadWriteRegex = /(?:open\s+(?:notepad|notes|记事本)\s+(?:and\s+)?(?:write|type|dictate|写入|输入)|(?:write|type|dictate|写入)\s+(.+?)\s+(?:in|into|to|on)\s+(?:notepad|notes|记事本)|(?:in|into)\s+(?:notepad|notes|记事本)\s+(?:write|type)\s+)(.+)/i;
        const npMatch = q.match(notepadWriteRegex);
        if (npMatch || (q.includes('notepad') && (q.includes('write') || q.includes('type') || q.includes('dictate')))) {
            let noteText = '';
            if (npMatch) {
                noteText = (npMatch[2] || npMatch[1] || '').trim();
            }
            if (!noteText) {
                const sub = input.replace(/.*(?:write|type|dictate|写入|输入)\s+/i, '').replace(/\s+(?:in|into|on)\s+(?:notepad|notes|记事本).*/i, '').trim();
                if (sub) noteText = sub;
            }
            if (noteText) {
                return {
                    action: 'bridge_notepad_write',
                    app: 'notepad',
                    text: noteText,
                    message: `Opening Notepad and writing: "${noteText}", ${this.config.userName}.`
                };
            }
        }

        // B. WhatsApp Messaging (e.g., "hello open WhatsApp and message to Janvi hai")
        const whatsappMsgRegex = /(?:open\s+whatsapp\s+(?:and\s+)?(?:message|send|text)|message|send|text)\s+(?:to\s+)?([a-zA-Z0-9_\u4e00-\u9fa5]+)\s+(?:saying\s+|that\s+|:|)(.+)/i;
        const waMatch = input.match(whatsappMsgRegex);
        if (waMatch && (q.includes('whatsapp') || q.includes('微信'))) {
            const contact = waMatch[1].trim();
            const msg = waMatch[2].trim();
            return {
                action: 'bridge_whatsapp_msg',
                contact,
                text: msg,
                url: 'https://web.whatsapp.com',
                message: `Opening WhatsApp Web for ${contact}, ${this.config.userName}. I have copied your message "${msg}" to your clipboard so you can paste and send immediately.`
            };
        }

        // C. YouTube Search & Playback (e.g., "open youtube and search Ae Dil Hai Mushkil", "search youtube for lo-fi music")
        if (q.includes('youtube') && (q.includes('search') || q.includes('play') || q.includes('find') || q.includes('look up') || q.includes('搜索') || q.includes('播放'))) {
            let ytQuery = input
                .replace(/^(?:please\s+|can\s+you\s+|hey\s+jarvis\s+|hello\s+)?(?:open\s+youtube\s+(?:and\s+)?|launch\s+youtube\s+(?:and\s+)?|go\s+to\s+youtube\s+(?:and\s+)?)/i, '')
                .replace(/^(?:search\s+(?:youtube\s+)?(?:for\s+|about\s+)?|play\s+(?:on\s+youtube\s+)?|find\s+(?:on\s+youtube\s+)?|look\s*up\s+(?:on\s+youtube\s+)?|搜索|播放)\s*/i, '')
                .replace(/\s+(?:on|in)\s+youtube.*$/i, '')
                .replace(/\s+(?:and\s+)?(?:play\s+(?:that|the|this)?\s*video|play\s+it|start\s+it|watch\s+it).*$/i, '')
                .replace(/\s+on\s+youtube$/i, '')
                .trim();
            if (ytQuery) {
                const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`;
                return {
                    action: 'bridge_search',
                    engine: 'youtube',
                    query: ytQuery,
                    url: ytUrl,
                    message: `Searching YouTube for "${ytQuery}", ${this.config.userName}. Opening video results in foreground.`
                };
            }
        }

        // D. Wikipedia / Knowledge Search
        if (q.includes('wikipedia') && (q.includes('search') || q.includes('look up') || q.includes('find') || q.includes('who is') || q.includes('what is'))) {
            let wikiQuery = input
                .replace(/.*(?:search|look up|find|who is|what is)\s+(?:for\s+|about\s+|on\s+wikipedia\s+for\s+)?/i, '')
                .replace(/\s+(?:on|in)\s+wikipedia.*/i, '')
                .replace(/.*wikipedia\s+(?:for\s+)?/i, '')
                .trim();
            if (wikiQuery) {
                const wikiUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(wikiQuery)}`;
                return {
                    action: 'bridge_search',
                    engine: 'wikipedia',
                    query: wikiQuery,
                    url: wikiUrl,
                    message: `Querying Wikipedia knowledge base for "${wikiQuery}", ${this.config.userName}.`
                };
            }
        }

        // E. GitHub Search
        if (q.includes('github') && (q.includes('search') || q.includes('find') || q.includes('repo'))) {
            let ghQuery = input
                .replace(/.*(?:search|find|repo|look up)\s+(?:for\s+|about\s+|on\s+github\s+for\s+)?/i, '')
                .replace(/\s+(?:on|in)\s+github.*/i, '')
                .replace(/.*github\s+(?:for\s+)?/i, '')
                .trim();
            if (ghQuery) {
                const ghUrl = `https://github.com/search?q=${encodeURIComponent(ghQuery)}`;
                return {
                    action: 'bridge_search',
                    engine: 'github',
                    query: ghQuery,
                    url: ghUrl,
                    message: `Searching GitHub repositories for "${ghQuery}", ${this.config.userName}.`
                };
            }
        }

        // F. General Google & Browser Search (e.g., "search quantum computing on google", "open browser and search for latest AI news")
        const isSearchIntent = q.startsWith('search ') || q.startsWith('google ') || q.startsWith('look up ') || q.startsWith('find ')
            || q.includes('search for ') || q.includes('search on google') || q.includes('google search')
            || (q.includes('browser') && (q.includes('search') || q.includes('look up') || q.includes('find') || q.includes('query')))
            || q.startsWith('搜索') || q.startsWith('查一下') || q.includes('在谷歌搜索') || q.includes('打开浏览器搜索');

        if (isSearchIntent) {
            let sQuery = input
                .replace(/^.*?(?:open\s+(?:browser|chrome|google|edge)\s+(?:and\s+)?(?:search|type|look\s*up)|(?:please\s+)?(?:search|google|look\s*up|find)\s+(?:for\s+|about\s+|on\s+google\s+for\s+)?|在谷歌搜索|打开浏览器搜索|搜索|查一下|找一下)\s*/i, '')
                .replace(/\s+(?:on|in)\s+(?:google|browser|chrome|internet|web).*/i, '')
                .replace(/[?]+$/, '')
                .trim();

            if (sQuery && sQuery.length > 1) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(sQuery)}`;
                return {
                    action: 'bridge_search',
                    engine: 'google',
                    query: sQuery,
                    url: searchUrl,
                    message: `Searching Google for "${sQuery}" on your host browser, ${this.config.userName}.`
                };
            }
        }

        // G. Standard System App & URL Launching (When no search/write payload specified)
        const hasOpenIntent = /(?:^|\s)(?:open|launch|start|run|goto|navigate|打开|启动|运行|访问)(?:\s|$)/i.test(q)
            || q.includes('打开') || q.includes('启动');

        if (hasOpenIntent || q.includes('whatsapp') || q.includes('spotify') || q.includes('youtube') || q.includes('github')) {
            // A. WhatsApp Web
            if (q.includes('whatsapp') || q.includes('微信')) {
                return {
                    action: 'bridge_url',
                    url: 'https://web.whatsapp.com',
                    message: `Opening WhatsApp Web directly on your host computer, ${this.config.userName}. You can now select the contact and send your message.`
                };
            }

            // B. Spotify / Music
            if (q.includes('spotify') || (hasOpenIntent && (q.includes('music') || q.includes('音乐')))) {
                return { action: 'bridge_app', app: 'spotify', message: `Initiating Spotify audio protocols on your host console, ${this.config.userName}.` };
            }

            // C. Notepad / Notes
            if (q.includes('notepad') || (hasOpenIntent && (q.includes('notes') || q.includes('记事本') || q.includes('便签')))) {
                return { action: 'bridge_app', app: 'notepad', message: `Launching Notepad editor on your primary display, ${this.config.userName}.` };
            }

            // D. Calculator
            if (q.includes('calc') || q.includes('calculator') || (hasOpenIntent && q.includes('计算器'))) {
                return { action: 'bridge_app', app: 'calc', message: `Calculator auxiliary unit deployed, ${this.config.userName}.` };
            }

            // E. VS Code / Code Editor
            if (q.includes('vscode') || q.includes('vs code') || (hasOpenIntent && (q.includes('code') || q.includes('代码')))) {
                return { action: 'bridge_app', app: 'code', message: `VS Code development matrix initiated, ${this.config.userName}.` };
            }

            // F. Google Chrome / Web Browser
            if (q.includes('chrome') || (hasOpenIntent && (q.includes('browser') || q.includes('浏览器') || q.includes('网页')))) {
                return { action: 'bridge_app', app: 'chrome', message: `Launching Google Chrome browser uplink, ${this.config.userName}.` };
            }

            // G. Windows Task Manager
            if (q.includes('task manager') || q.includes('taskmgr') || (hasOpenIntent && q.includes('任务管理器'))) {
                return { action: 'bridge_app', app: 'taskmgr', message: `Windows Task Manager telemetry summoned to screen, ${this.config.userName}.` };
            }

            // H. File Explorer
            if (q.includes('file explorer') || (hasOpenIntent && (q.includes('files') || q.includes('explorer') || q.includes('文件管理器') || q.includes('文件夹')))) {
                return { action: 'bridge_app', app: 'explorer', message: `Opening Windows File Explorer directory, ${this.config.userName}.` };
            }

            // I. YouTube
            if (q.includes('youtube')) {
                return { action: 'bridge_url', url: 'https://youtube.com', message: `Connecting host browser directly to YouTube, ${this.config.userName}.` };
            }

            // J. GitHub
            if (q.includes('github')) {
                return { action: 'bridge_url', url: 'https://github.com', message: `Opening GitHub repositories on your host console, ${this.config.userName}.` };
            }

            // K. Google Search
            if (hasOpenIntent && (q.includes('google') || q.includes('谷歌'))) {
                return { action: 'bridge_url', url: 'https://google.com', message: `Opening Google on your host browser, ${this.config.userName}.` };
            }
        }

        // 4. Screenshot Capture on Computer (English & Chinese)
        if (q.includes('screenshot') || q.includes('capture screen') || q.includes('take a screenshot') || q.includes('capture display') || q.includes('截屏') || q.includes('截图')) {
            return { action: 'bridge_screenshot', message: `Capturing desktop display buffer now, ${this.config.userName}. Transmitting image feed to your screen.` };
        }

        // 5. Volume Control on Computer (English & Chinese)
        if (q.includes('volume') || q.includes('mute') || q.includes('unmute') || q.includes('音量') || q.includes('静音')) {
            if ((q.includes('mute') && !q.includes('unmute')) || q.includes('静音')) {
                return { action: 'bridge_volume', volumeAction: 'mute', message: `Host computer audio output muted, ${this.config.userName}.` };
            } else if (q.includes('unmute') || q.includes('取消静音')) {
                return { action: 'bridge_volume', volumeAction: 'unmute', message: `Host computer audio unmuted, ${this.config.userName}.` };
            } else if (q.includes('down') || q.includes('lower') || q.includes('decrease') || q.includes('softer') || q.includes('调小') || q.includes('减小') || q.includes('降低')) {
                return { action: 'bridge_volume', volumeAction: 'down', message: `Lowering host system volume, ${this.config.userName}.` };
            } else if (q.includes('up') || q.includes('raise') || q.includes('increase') || q.includes('louder') || q.includes('调大') || q.includes('加大') || q.includes('提高')) {
                return { action: 'bridge_volume', volumeAction: 'up', message: `Raising host system volume, ${this.config.userName}.` };
            } else if (q.includes('max') || q.includes('100%') || q.includes('最大')) {
                return { action: 'bridge_volume', volumeAction: 'max', message: `Acoustic repulsors set to maximum volume, ${this.config.userName}.` };
            }
        }

        // 6. Lock Computer / Security (English & Chinese)
        if (q.includes('lock computer') || q.includes('lock pc') || q.includes('lock workstation') || q.includes('lock screen') || q.includes('锁屏') || q.includes('锁定电脑')) {
            return { action: 'bridge_lock', message: `Locking host workstation immediately. Perimeter security engaged, ${this.config.userName}.` };
        }

        // 7. Run Terminal / PowerShell Command on Computer
        if (q.startsWith('run command ') || q.startsWith('execute ') || q.startsWith('cmd ') || q.startsWith('powershell ') || q.startsWith('运行命令 ') || q.startsWith('执行命令 ')) {
            const cmd = input.replace(/^(run command|execute|cmd|powershell|运行命令|执行命令)\s+/i, '').trim();
            if (cmd) {
                return { action: 'bridge_exec', command: cmd, message: `Executing command: "${cmd}" on host console...` };
            }
        }

        // 8. Real Hardware Stats Query (English & Chinese)
        if (q.includes('cpu') || q.includes('ram') || q.includes('hardware stats') || q.includes('pc stats') || q.includes('system status') || q.includes('系统状态') || q.includes('硬件状态')) {
            if (this.systemBridge && this.systemBridge.systemStats) {
                const s = this.systemBridge.systemStats;
                return {
                    action: 'response',
                    message: `Host hardware diagnostic: CPU utilization at ${s.cpuLoad}%, RAM at ${s.ramPercent}% (${s.ramDetails?.used} used of ${s.ramDetails?.total}), platform ${s.hostname}. All circuits nominal, ${this.config.userName}.`
                };
            }
        }

        // 9. Weather Query (English & Chinese)
        if (q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('climate') || q.includes('天气') || q.includes('气温')) {
            return { action: 'weather', message: null };
        }

        // 10. Mission Directive Commands (English & Chinese)
        if (q.startsWith('add task:') || q.startsWith('add directive:') || q.startsWith('new task:') || q.startsWith('添加任务:') || q.startsWith('增加任务:')) {
            const taskText = input.replace(/^(add task:|add directive:|new task:|添加任务:|增加任务:)\s*/i, '').trim();
            if (taskText) {
                return { action: 'add_task', text: taskText, message: `I have cataloged "${taskText}" into your active mission directives, ${this.config.userName}.` };
            }
        }

        if (q === 'show tasks' || q === 'show directives' || q === 'list tasks' || q === 'list directives' || q === '查看任务' || q === '显示任务') {
            const pending = this.directives.getPendingTasks();
            if (pending.length === 0) {
                return { action: 'response', message: `You have zero pending directives on your docket, ${this.config.userName}. All objectives accomplished.` };
            }
            const summary = pending.map((t, idx) => `${idx + 1}. ${t.text}`).join(' | ');
            return { action: 'response', message: `You have ${pending.length} pending directives: ${summary}.` };
        }

        if (q === 'clear tasks' || q === 'clear directives' || q === 'delete all tasks' || q === '清空任务') {
            return { action: 'clear_tasks', message: `All active mission directives have been archived and cleared, ${this.config.userName}.` };
        }

        // 11. Tactical Notes Command (English & Chinese)
        if (q.startsWith('save note:') || q.startsWith('note:') || q.startsWith('record note:') || q.startsWith('保存笔记:') || q.startsWith('记录笔记:')) {
            const noteText = input.replace(/^(save note:|note:|record note:|保存笔记:|记录笔记:)\s*/i, '').trim();
            if (noteText) {
                return { action: 'save_note', text: noteText, message: `Classified note recorded to tactical scratchpad: "${noteText}".` };
            }
        }

        // 12. Clear Conversation
        if (q === 'clear logs' || q === 'clear screen' || q === 'clear chat' || q === 'clear feed') {
            return { action: 'clear_chat', message: `Transmission feed and neural dialogue cache purged, ${this.config.userName}.` };
        }

        // 13. Autonomous Multi-Step Workflows Across Apps
        if (q.startsWith('workflow:') || q.startsWith('run workflow') || q.startsWith('execute workflow') || q.startsWith('plan workflow')) {
            const goal = input.replace(/^(workflow:|run workflow|execute workflow|plan workflow)\s*/i, '').trim();
            if (goal && window.jarvisWorkflow) {
                window.jarvisWorkflow.createPlan(goal).then(plan => {
                    window.jarvisWorkflow.executeWorkflow(plan);
                });
                return {
                    action: 'response',
                    message: `Autonomous multi-step pipeline initialized for "${goal}". Coordinating cross-app tools, ${this.config.userName}.`
                };
            }
        }

        // 14. Math calculations
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
                max_tokens: 1024
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
            const msg = data.choices?.[0]?.message;
            rawResponse = msg?.content || msg?.refusal || (msg?.reasoning ? `[Analysis]: ${msg.reasoning}` : '') || 'No transmission returned from Groq LPU core.';
        } else if (provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            const body = {
                model: activeModel,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 1024
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
            const msg = data.choices?.[0]?.message;
            rawResponse = msg?.content || msg?.refusal || 'No response returned from OpenAI core.';
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

        if (!match) {
            // Conversational fallback: If the LLM declared it is opening/launching something but omitted the tag
            const lower = response.toLowerCase();
            try {
                if (lower.includes('opening whatsapp') || lower.includes('launching whatsapp') || lower.includes('open whatsapp')) {
                    await this.systemBridge.openUrl('https://web.whatsapp.com');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: Opening WhatsApp Web`);
                } else if (lower.includes('opening spotify') || lower.includes('launching spotify')) {
                    await this.systemBridge.openApp('spotify');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: Spotify`);
                } else if (lower.includes('opening notepad') || lower.includes('launching notepad')) {
                    await this.systemBridge.openApp('notepad');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: Notepad`);
                } else if (lower.includes('opening calculator') || lower.includes('launching calculator')) {
                    await this.systemBridge.openApp('calc');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: Calculator`);
                } else if (lower.includes('opening chrome') || lower.includes('launching chrome')) {
                    await this.systemBridge.openApp('chrome');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: Chrome`);
                } else if (lower.includes('opening youtube') || lower.includes('launching youtube')) {
                    await this.systemBridge.openUrl('https://youtube.com');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: YouTube`);
                } else if (lower.includes('opening github') || lower.includes('launching github')) {
                    await this.systemBridge.openUrl('https://github.com');
                    this.telemetry.appendLog(`[ACTION] Conversational trigger caught: GitHub`);
                }
            } catch (fallbackErr) {
                console.warn('Fallback conversational trigger error:', fallbackErr);
            }
            return response;
        }

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
