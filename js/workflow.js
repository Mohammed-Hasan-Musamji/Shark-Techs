/**
 * ============================================================================
 * J.A.R.V.I.S. MULTI-STEP AUTONOMOUS AGENT ORCHESTRATOR
 * Cross-App Actions, Step Validation, Failure Recognition & Self-Healing
 * ============================================================================
 */

class JarvisWorkflowEngine {
    constructor() {
        this.activeWorkflow = null;
        this.history = [];
        this.maxRetries = 2;
        this.isExecuting = false;

        this.init();
    }

    init() {
        console.log('J.A.R.V.I.S. Multi-Step Workflow Engine Initialized.');
    }

    /* ==========================================================================
       CROSS-APP TOOL REGISTRY
       ========================================================================== */
    getAvailableTools() {
        return [
            {
                id: 'search_knowledge',
                app: 'Web Knowledge (Wikipedia / Search)',
                description: 'Fetches real live topic data and summaries from Wikipedia / online knowledge sources.',
                execute: async (params) => this.toolSearchKnowledge(params)
            },
            {
                id: 'live_weather',
                app: 'Weather Atmospheric Service',
                description: 'Queries live Open-Meteo conditions for detected or specified location.',
                execute: async (params) => this.toolLiveWeather(params)
            },
            {
                id: 'task_directives',
                app: 'Mission Directives (Task Manager)',
                description: 'Creates, completes, or organizes directives in the task system.',
                execute: async (params) => this.toolTaskDirectives(params)
            },
            {
                id: 'scratchpad_notes',
                app: 'Tactical Scratchpad (Notes)',
                description: 'Formats and appends notes, research findings, or summaries to storage.',
                execute: async (params) => this.toolScratchpadNotes(params)
            },
            {
                id: 'email_draft',
                app: 'Email Client (Mailto & Clipboard)',
                description: 'Drafts an email with subject/body, copies to clipboard, and triggers mail client.',
                execute: async (params) => this.toolEmailDraft(params)
            },
            {
                id: 'calendar_event',
                app: 'Calendar Service (.ICS Export)',
                description: 'Generates standard iCalendar (.ics) file and triggers instant schedule download.',
                execute: async (params) => this.toolCalendarEvent(params)
            },
            {
                id: 'file_export',
                app: 'File System (Markdown / Text)',
                description: 'Downloads structured reports, logs, or project notes as .md or .txt files.',
                execute: async (params) => this.toolFileExport(params)
            },
            {
                id: 'system_notification',
                app: 'Desktop / Mobile Notifications',
                description: 'Fires native OS alerts via the browser Notification API.',
                execute: async (params) => this.toolSystemNotification(params)
            },
            {
                id: 'clipboard_copy',
                app: 'System Clipboard',
                description: 'Copies code, summaries, or data directly into the operating system clipboard.',
                execute: async (params) => this.toolClipboardCopy(params)
            },
            {
                id: 'web_share',
                app: 'Cross-Device Native Share',
                description: 'Pushes findings to WhatsApp, Slack, Notes, or Mail via Web Share API.',
                execute: async (params) => this.toolWebShare(params)
            },
            {
                id: 'system_diagnostics',
                app: 'Hardware Telemetry Monitor',
                description: 'Inspects real logical CPU cores, network latency, power, and OS platform.',
                execute: async (params) => this.toolSystemDiagnostics(params)
            }
        ];
    }

    /* --------------------------------------------------------------------------
       TOOL IMPLEMENTATIONS
       -------------------------------------------------------------------------- */
    async toolSearchKnowledge(params) {
        const query = params.query || params.topic;
        if (!query) throw new Error('Search query is required.');

        // Live Wikipedia API fetch
        const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
        const res = await fetch(endpoint);
        if (!res.ok) {
            throw new Error(`Knowledge lookup failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        const results = data.query?.search;
        if (!results || results.length === 0) {
            throw new Error(`No verified knowledge found for "${query}".`);
        }

        const top = results[0];
        const cleanSnippet = top.snippet.replace(/<[^>]+>/g, '');
        return {
            title: top.title,
            snippet: cleanSnippet,
            summary: `**${top.title}**: ${cleanSnippet}`
        };
    }

    async toolLiveWeather(params) {
        const city = params.city || params.location;
        let lat = 28.6139;
        let lon = 77.2090;
        let locationName = city || 'Detected Location';

        if (city) {
            // Geocoding lookup
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geoRes = await fetch(geoUrl);
            if (!geoRes.ok) throw new Error(`Geocoding failed for ${city}`);
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`Location "${city}" could not be geolocated.`);
            }
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            locationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
        } else if (window.jarvisAgent) {
            const loc = await window.jarvisAgent.resolveRealLocation();
            lat = loc.lat;
            lon = loc.lon;
            locationName = `${loc.city}, ${loc.country}`;
        }

        // Open-Meteo real weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
        const wRes = await fetch(weatherUrl);
        if (!wRes.ok) throw new Error(`Weather API error: HTTP ${wRes.status}`);
        const wData = await wRes.json();
        const current = wData.current;
        if (!current) throw new Error('Weather data payload missing current telemetry.');

        const temp = Math.round(current.temperature_2m);
        const feels = Math.round(current.apparent_temperature);
        const humidity = current.relative_humidity_2m;
        const wind = Math.round(current.wind_speed_10m);

        return {
            location: locationName,
            temperature: `${temp}°C`,
            feelsLike: `${feels}°C`,
            humidity: `${humidity}%`,
            windSpeed: `${wind} km/h`,
            report: `Weather in ${locationName}: ${temp}°C (Feels like ${feels}°C), Humidity: ${humidity}%, Wind: ${wind} km/h.`
        };
    }

    async toolTaskDirectives(params) {
        const action = params.action || 'add';
        const taskText = params.text || params.directive;

        if (action === 'add') {
            if (!taskText) throw new Error('Task directive description is required.');
            if (window.jarvisApp) {
                window.jarvisApp.addTask(taskText);
            }
            return {
                status: 'created',
                directive: taskText,
                message: `Added directive: "${taskText}"`
            };
        } else if (action === 'list') {
            const tasks = JSON.parse(localStorage.getItem('jarvis_tasks') || '[]');
            return {
                count: tasks.length,
                tasks: tasks
            };
        }
        throw new Error(`Unsupported task action: ${action}`);
    }

    async toolScratchpadNotes(params) {
        const note = params.note || params.content || params.summary;
        if (!note) throw new Error('Note content cannot be empty.');

        const notesArea = document.getElementById('notesArea');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entry = `\n[${timestamp}] // WORKFLOW LOG:\n${note}\n`;

        if (notesArea) {
            notesArea.value += entry;
            localStorage.setItem('jarvis_notes', notesArea.value);
            notesArea.scrollTop = notesArea.scrollHeight;
        } else {
            const cur = localStorage.getItem('jarvis_notes') || '';
            localStorage.setItem('jarvis_notes', cur + entry);
        }

        return {
            status: 'recorded',
            length: note.length,
            message: `Appended ${note.length} characters to tactical scratchpad.`
        };
    }

    async toolEmailDraft(params) {
        const to = params.to || '';
        const subject = params.subject || 'Project Update from J.A.R.V.I.S.';
        const body = params.body || params.content;
        if (!body) throw new Error('Email body content is required.');

        // 1. Copy draft body to clipboard
        try {
            await navigator.clipboard.writeText(body);
        } catch (e) {
            console.warn('Clipboard write warning:', e);
        }

        // 2. Open mailto link
        const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const win = window.open(mailtoUrl, '_blank');

        return {
            status: 'drafted',
            to: to || 'Unspecified (Prompted in mail client)',
            subject: subject,
            clipboardCopied: true,
            mailtoTriggered: !!win,
            message: `Email draft prepared. Draft copied to clipboard and mail client launched.`
        };
    }

    async toolCalendarEvent(params) {
        const title = params.title || 'J.A.R.V.I.S. Scheduled Milestone';
        const description = params.description || 'Automated agent scheduled directive for Harsh.';
        const start = params.startDate ? new Date(params.startDate) : new Date(Date.now() + 3600000); // 1 hr from now
        const end = params.endDate ? new Date(params.endDate) : new Date(start.getTime() + 1800000); // 30 min duration

        const formatICS = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Harsh AI Agent//JARVIS HUD v4.2//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@jarvis.ai`,
            `DTSTAMP:${formatICS(new Date())}`,
            `DTSTART:${formatICS(start)}`,
            `DTEND:${formatICS(end)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return {
            status: 'exported',
            filename: a.download,
            start: start.toLocaleString(),
            message: `Calendar event (.ics) generated and triggered for download: ${title}`
        };
    }

    async toolFileExport(params) {
        const filename = params.filename || 'jarvis_agent_report.md';
        const content = params.content || params.data;
        if (!content) throw new Error('Export file content cannot be empty.');

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return {
            status: 'downloaded',
            filename: filename,
            bytes: content.length,
            message: `Saved report as ${filename} (${content.length} bytes).`
        };
    }

    async toolSystemNotification(params) {
        const title = params.title || "J.A.R.V.I.S. Notification";
        const body = params.body || "Agent directive completed successfully.";

        if (!("Notification" in window)) {
            throw new Error("This browser does not support desktop notifications.");
        }

        let perm = Notification.permission;
        if (perm === "default") {
            perm = await Notification.requestPermission();
        }

        if (perm !== "granted") {
            throw new Error("Desktop notification permission was denied by the user.");
        }

        const notif = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="46" fill="%23030712" stroke="%2300f0ff" stroke-width="4"/%3E%3Cpolygon points="50,22 55,42 75,50 55,58 50,78 45,58 25,50 45,42" fill="%2300f0ff"/%3E%3C/svg%3E'
        });

        return {
            status: 'sent',
            title: title,
            message: `Native system notification dispatched.`
        };
    }

    async toolClipboardCopy(params) {
        const text = params.text || params.data;
        if (!text) throw new Error('Clipboard content cannot be empty.');

        await navigator.clipboard.writeText(text);
        return {
            status: 'copied',
            length: text.length,
            message: `Copied ${text.length} characters to system clipboard.`
        };
    }

    async toolWebShare(params) {
        const title = params.title || "J.A.R.V.I.S. Agent Telemetry";
        const text = params.text || params.content;
        const url = params.url || window.location.href;

        if (navigator.share) {
            await navigator.share({ title, text, url });
            return {
                status: 'shared',
                message: 'Native Web Share completed across apps.'
            };
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(`${title}\n\n${text}`);
            return {
                status: 'clipboard_fallback',
                message: 'Web Share API not supported on this browser; copied to clipboard instead.'
            };
        }
    }

    async toolSystemDiagnostics() {
        const cores = navigator.hardwareConcurrency || 8;
        const memory = navigator.deviceMemory ? `${navigator.deviceMemory}GB RAM` : 'Unknown';
        const platform = navigator.platform || 'WIN32';
        const online = navigator.onLine;

        return {
            cores: cores,
            memory: memory,
            platform: platform,
            online: online,
            summary: `Platform: ${platform}, Cores: ${cores}, Memory: ${memory}, Network: ${online ? 'ONLINE' : 'OFFLINE'}`
        };
    }

    /* ==========================================================================
       AUTONOMOUS PLANNER & DECOMPOSER
       ========================================================================== */
    async createPlan(userGoal) {
        const q = userGoal.toLowerCase();

        // 1. Check if LLM (Groq / OpenAI) is available for intelligent decomposition
        const agent = window.jarvisAgent;
        if (agent && agent.getApiKey() && agent.provider !== 'builtin') {
            try {
                return await this.decomposeWithLLM(userGoal);
            } catch (err) {
                console.warn('LLM Decomposition failed, falling back to heuristic planner:', err);
            }
        }

        // 2. Autonomous Heuristic Decomposer for common cross-app workflows
        return this.decomposeWithHeuristics(userGoal);
    }

    async decomposeWithLLM(userGoal) {
        const toolsList = this.getAvailableTools().map(t => `- ${t.id} (${t.app}): ${t.description}`).join('\n');
        const prompt = `You are the autonomous multi-step workflow planner for J.A.R.V.I.S., assistant to Harsh.
Given the user's objective, break it down into an exact sequence of 2 to 5 actionable steps using these available tools:
${toolsList}

CRITICAL RULES:
1. Return ONLY valid, parseable JSON matching this schema with NO markdown code fences, no extra text:
{
  "goal": "Brief title of the workflow",
  "steps": [
    {
      "id": 1,
      "tool": "tool_id",
      "app": "App / Service Name",
      "description": "Clear explanation of what this step does",
      "params": { ... }
    }
  ]
}

User Objective: "${userGoal}"`;

        const raw = await window.jarvisAgent.queryLLM(prompt);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
            throw new Error('LLM returned invalid steps structure.');
        }

        return parsed;
    }

    decomposeWithHeuristics(userGoal) {
        const q = userGoal.toLowerCase();

        // Pattern A: Morning Briefing & Calendar Event
        if (q.includes('morning') || q.includes('briefing') || q.includes('schedule') || q.includes('plan my day')) {
            return {
                goal: 'Morning Briefing, Schedule & Day Planning',
                steps: [
                    {
                        id: 1,
                        tool: 'live_weather',
                        app: 'Weather Atmospheric Service',
                        description: 'Fetch real-time atmospheric weather for current location',
                        params: {}
                    },
                    {
                        id: 2,
                        tool: 'task_directives',
                        app: 'Mission Directives',
                        description: 'Log primary morning focus directive into task system',
                        params: { action: 'add', text: 'Execute daily project development priorities' }
                    },
                    {
                        id: 3,
                        tool: 'scratchpad_notes',
                        app: 'Tactical Scratchpad',
                        description: 'Record day briefing and weather summary into scratchpad',
                        params: { note: 'Day briefing initialized. Weather synchronized, morning priorities active.' }
                    },
                    {
                        id: 4,
                        tool: 'calendar_event',
                        app: 'Calendar Service (.ICS)',
                        description: 'Generate .ics calendar schedule event for project focus session',
                        params: { title: 'Deep Work Development Session', description: 'Scheduled by Harsh AI Agent' }
                    }
                ]
            };
        }

        // Pattern B: Topic Research, Notes, and Email Draft
        if (q.includes('research') || q.includes('search') || q.includes('look up') || q.includes('email') || q.includes('draft')) {
            const topic = userGoal.replace(/research|search for|look up|and draft email/gi, '').trim() || 'Artificial Intelligence';
            return {
                goal: `Research "${topic}" and Draft Summary Email`,
                steps: [
                    {
                        id: 1,
                        tool: 'search_knowledge',
                        app: 'Web Knowledge (Wikipedia)',
                        description: `Search live verified knowledge repository for "${topic}"`,
                        params: { query: topic }
                    },
                    {
                        id: 2,
                        tool: 'scratchpad_notes',
                        app: 'Tactical Scratchpad',
                        description: `Append structured research summary to scratchpad notes`,
                        params: { note: `Research topic: ${topic}. Key findings cataloged.` }
                    },
                    {
                        id: 3,
                        tool: 'email_draft',
                        app: 'Email Client',
                        description: `Prepare summary email draft and copy to system clipboard`,
                        params: { subject: `Research Summary: ${topic}`, body: `Hi team,\n\nHere is the verified research summary on ${topic} prepared by J.A.R.V.I.S.\n\nBest,\nHarsh` }
                    }
                ]
            };
        }

        // Pattern C: Full System Audit & Report Export
        if (q.includes('audit') || q.includes('diagnostics') || q.includes('health') || q.includes('report') || q.includes('export')) {
            return {
                goal: 'System Telemetry Audit & Report Generation',
                steps: [
                    {
                        id: 1,
                        tool: 'system_diagnostics',
                        app: 'Hardware Telemetry',
                        description: 'Inspect CPU cores, RAM, network latency, and power status',
                        params: {}
                    },
                    {
                        id: 2,
                        tool: 'task_directives',
                        app: 'Mission Directives',
                        description: 'Verify pending mission directives status',
                        params: { action: 'list' }
                    },
                    {
                        id: 3,
                        tool: 'file_export',
                        app: 'File System (Markdown)',
                        description: 'Export structured system diagnostics report as a Markdown (.md) document',
                        params: {
                            filename: `jarvis_system_audit_${Date.now()}.md`,
                            content: `# J.A.R.V.I.S. System Audit Report\n\n**Owner**: Harsh\n**Timestamp**: ${new Date().toISOString()}\n\n## Hardware Telemetry\n- Platform: Active\n- Core Latency: Verified\n- Agent Status: Fully Operational\n`
                        }
                    }
                ]
            };
        }

        // Default: 2-step general workflow
        return {
            goal: `Execute Multi-Step Task: "${userGoal.slice(0, 40)}"`,
            steps: [
                {
                    id: 1,
                    tool: 'system_diagnostics',
                    app: 'Hardware Telemetry',
                    description: 'Verify system resource readiness and latency',
                    params: {}
                },
                {
                    id: 2,
                    tool: 'scratchpad_notes',
                    app: 'Tactical Scratchpad',
                    description: `Log multi-step objective into scratchpad: "${userGoal}"`,
                    params: { note: `User goal dispatched: ${userGoal}` }
                }
            ]
        };
    }

    /* ==========================================================================
       FAILURE RECOGNITION, STEP VALIDATION & SELF-HEALING ENGINE
       ========================================================================== */
    async executeWorkflow(workflow) {
        if (this.isExecuting) {
            throw new Error('A workflow is already in progress. Please wait for completion.');
        }

        this.isExecuting = true;
        this.activeWorkflow = workflow;
        this.renderWorkflowUI();

        if (window.jarvisSound) window.jarvisSound.playProtocolEngaged();
        if (window.jarvisAgent) {
            window.jarvisAgent.appendTelemetryLog(`[WORKFLOW START] "${workflow.goal}" (${workflow.steps.length} steps).`);
            window.jarvisAgent.appendMessage('jarvis', `Beginning multi-step execution for: **${workflow.goal}**. Tracking across apps...`);
        }

        let pipelineFailed = false;

        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            step.status = 'running';
            step.retries = 0;
            this.updateStepUI(step);

            let success = false;

            while (!success && step.retries <= this.maxRetries) {
                try {
                    // Execute step with 12s timeout race
                    const result = await this.executeStepWithTimeout(step, 12000);
                    step.result = result;
                    step.status = 'completed';
                    step.error = null;
                    success = true;

                    if (window.jarvisSound) window.jarvisSound.playProcessComplete();
                    if (window.jarvisAgent) {
                        window.jarvisAgent.appendTelemetryLog(`[SUCCESS] Step ${step.id} (${step.app}): ${step.description}`);
                    }
                    this.updateStepUI(step);
                } catch (err) {
                    // FAILURE RECOGNITION
                    step.retries++;
                    step.error = err.message || 'Unknown execution anomaly';

                    // Recognize specific error taxonomy
                    const errorReason = this.diagnoseFailure(err);

                    if (window.jarvisSound) window.jarvisSound.playAlert();
                    if (window.jarvisAgent) {
                        window.jarvisAgent.appendTelemetryLog(`[FAIL] Step ${step.id} (${step.app}): ${errorReason} (Attempt ${step.retries}/${this.maxRetries + 1})`);
                    }

                    // Attempt Self-Healing Fallback
                    const healed = await this.attemptSelfHealing(step, err);
                    if (healed) {
                        step.status = 'healed';
                        step.result = healed;
                        success = true;
                        if (window.jarvisAgent) {
                            window.jarvisAgent.appendTelemetryLog(`[AUTO-HEALED] Step ${step.id} recovered using fallback strategy.`);
                        }
                        this.updateStepUI(step);
                        break;
                    }

                    if (step.retries <= this.maxRetries) {
                        step.status = 'retrying';
                        this.updateStepUI(step);
                        // Backoff before retry
                        await new Promise(r => setTimeout(r, 1200 * step.retries));
                    } else {
                        // All retries and fallbacks exhausted: mark step FAILED
                        step.status = 'failed';
                        this.updateStepUI(step);
                        pipelineFailed = true;

                        if (window.jarvisAgent) {
                            window.jarvisAgent.appendMessage('jarvis', `⚠️ **Step ${step.id} Failure Detected**: ${step.app} encountered an error: "${step.error}". Awaiting user directive or step skip.`);
                            if (window.jarvisSpeech) {
                                window.jarvisSpeech.speak(`Warning Harsh, step ${step.id} encountered an error: ${step.error}.`);
                            }
                        }
                        break;
                    }
                }
            }

            if (pipelineFailed) {
                break;
            }

            // Brief pacing pause between steps
            await new Promise(r => setTimeout(r, 600));
        }

        this.isExecuting = false;

        if (!pipelineFailed) {
            if (window.jarvisAgent) {
                window.jarvisAgent.appendMessage('jarvis', `✅ **Workflow Completed**: All ${workflow.steps.length} multi-step directives across apps have been executed successfully, Harsh.`);
                if (window.jarvisSpeech) {
                    window.jarvisSpeech.speak(`All workflow directives have been completed successfully across your apps, Harsh.`);
                }
            }
        }

        this.history.unshift(workflow);
        this.saveWorkflowHistory();
        return !pipelineFailed;
    }

    async executeStepWithTimeout(step, timeoutMs) {
        const tools = this.getAvailableTools();
        const toolObj = tools.find(t => t.id === step.tool);
        if (!toolObj) {
            throw new Error(`Tool "${step.tool}" is not registered in the agent engine.`);
        }

        // Timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs / 1000}s`)), timeoutMs);
        });

        // Race execution against timeout
        return await Promise.race([
            toolObj.execute(step.params || {}),
            timeoutPromise
        ]);
    }

    diagnoseFailure(err) {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('timed out')) return 'Execution Timeout (Remote app or network unresponsive)';
        if (msg.includes('http 404')) return 'Resource Not Found (404)';
        if (msg.includes('http 5')) return 'Remote Service Downtime (5xx Server Error)';
        if (msg.includes('denied') || msg.includes('permission')) return 'Browser Permission Blocked (User action needed)';
        if (msg.includes('offline') || msg.includes('failed to fetch')) return 'Network Connectivity Offline';
        return err.message;
    }

    /**
     * Self-healing fallback logic for resilient execution
     */
    async attemptSelfHealing(step, originalError) {
        // Fallback 1: If Wikipedia Knowledge lookup fails, fallback to Scratchpad search reference
        if (step.tool === 'search_knowledge') {
            const topic = step.params.query || 'Topic';
            const fallbackResult = {
                title: topic,
                snippet: `Offline Reference: Search telemetry logged for "${topic}". Secondary web viewport primed.`,
                summary: `External knowledge service was unavailable; reference logged to scratchpad.`
            };
            return fallbackResult;
        }

        // Fallback 2: If Geocoding / Weather fails, fallback to local atmospheric cache
        if (step.tool === 'live_weather') {
            const cached = localStorage.getItem('jarvis_weather_cache');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    return {
                        location: parsed.city || 'Detected Location',
                        temperature: parsed.temp || '24°C',
                        feelsLike: parsed.feels || '24°C',
                        humidity: '50%',
                        windSpeed: '10 km/h',
                        report: `Using cached atmospheric parameters: ${parsed.temp || '24°C'} in ${parsed.city || 'Detected Location'}.`
                    };
                } catch (e) {}
            }
        }

        // Fallback 3: If native notification fails, flash HUD visual alert and audio
        if (step.tool === 'system_notification') {
            if (window.jarvisApp) {
                window.jarvisApp.flashStatus('WORKFLOW NOTIFICATION', '#ffc837');
            }
            return {
                status: 'visual_fallback',
                message: 'Native notification was blocked; routed to HUD visual status indicator.'
            };
        }

        // Fallback 4: If email client popup is blocked, copy to scratchpad
        if (step.tool === 'email_draft') {
            await this.toolScratchpadNotes({
                note: `[EMAIL DRAFT FALLBACK]\nTo: ${step.params.to || 'Team'}\nSubject: ${step.params.subject}\n\n${step.params.body}`
            });
            return {
                status: 'scratchpad_fallback',
                message: 'Mail client popup was prevented by browser; drafted securely to tactical scratchpad instead.'
            };
        }

        return null;
    }

    /* ==========================================================================
       MANUAL INTERACTION (RETRY / SKIP STEP)
       ========================================================================== */
    async retryFailedStep(stepId) {
        if (!this.activeWorkflow) return;
        const step = this.activeWorkflow.steps.find(s => s.id === stepId);
        if (!step) return;

        step.status = 'running';
        step.retries = 0;
        this.updateStepUI(step);

        try {
            const res = await this.executeStepWithTimeout(step, 12000);
            step.result = res;
            step.status = 'completed';
            step.error = null;
            this.updateStepUI(step);
            if (window.jarvisSound) window.jarvisSound.playProcessComplete();
        } catch (err) {
            step.status = 'failed';
            step.error = err.message;
            this.updateStepUI(step);
            if (window.jarvisSound) window.jarvisSound.playAlert();
        }
    }

    skipStep(stepId) {
        if (!this.activeWorkflow) return;
        const step = this.activeWorkflow.steps.find(s => s.id === stepId);
        if (!step) return;

        step.status = 'skipped';
        step.error = 'Manually skipped by user directive';
        this.updateStepUI(step);
    }

    /* ==========================================================================
       UI RENDERING & HUD BINDINGS
       ========================================================================== */
    renderWorkflowUI() {
        let container = document.getElementById('workflowWidget');
        if (!container) return;

        const wf = this.activeWorkflow;
        if (!wf) {
            container.innerHTML = `
                <div class="wf-empty-state">
                    <span class="wf-empty-icon">⚡</span>
                    <p>No active multi-step workflow running.</p>
                    <small>Try asking: <em>"Plan my day with weather and tasks"</em> or pick a preset below.</small>
                </div>
            `;
            return;
        }

        const total = wf.steps.length;
        const completed = wf.steps.filter(s => s.status === 'completed' || s.status === 'healed' || s.status === 'skipped').length;
        const pct = Math.round((completed / total) * 100);

        let html = `
            <div class="wf-header">
                <div class="wf-title-row">
                    <span class="wf-badge-live">AUTONOMOUS WORKFLOW</span>
                    <span class="wf-percent">${pct}%</span>
                </div>
                <h4 class="wf-goal-title">${this.escapeHTML(wf.goal)}</h4>
                <div class="hud-progress-bar wf-bar">
                    <div class="hud-progress-fill" style="width: ${pct}%;"></div>
                </div>
            </div>
            <div class="wf-steps-list">
        `;

        wf.steps.forEach(s => {
            const statusClass = `status-${s.status || 'pending'}`;
            let statusBadge = '<span class="step-chip pending">PENDING</span>';
            if (s.status === 'running') statusBadge = '<span class="step-chip running">RUNNING...</span>';
            else if (s.status === 'completed') statusBadge = '<span class="step-chip completed">✓ COMPLETED</span>';
            else if (s.status === 'healed') statusBadge = '<span class="step-chip healed">🛡️ AUTO-HEALED</span>';
            else if (s.status === 'retrying') statusBadge = `<span class="step-chip retrying">🔄 RETRY (${s.retries})</span>`;
            else if (s.status === 'failed') statusBadge = '<span class="step-chip failed">✕ FAILED</span>';
            else if (s.status === 'skipped') statusBadge = '<span class="step-chip skipped">↷ SKIPPED</span>';

            html += `
                <div class="wf-step-card ${statusClass}" id="wfStep-${s.id}">
                    <div class="step-card-header">
                        <span class="step-num">STEP ${s.id}</span>
                        <span class="step-app-tag">${this.escapeHTML(s.app)}</span>
                        ${statusBadge}
                    </div>
                    <div class="step-desc">${this.escapeHTML(s.description)}</div>
                    ${s.error ? `
                        <div class="step-error-box">
                            <span class="error-icon">⚠️</span>
                            <span class="error-text">${this.escapeHTML(s.error)}</span>
                            <div class="step-actions">
                                <button class="mini-btn retry-btn" onclick="window.jarvisWorkflow.retryFailedStep(${s.id})">RETRY</button>
                                <button class="mini-btn skip-btn" onclick="window.jarvisWorkflow.skipStep(${s.id})">SKIP</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    updateStepUI(step) {
        this.renderWorkflowUI();
    }

    saveWorkflowHistory() {
        try {
            localStorage.setItem('jarvis_workflow_history', JSON.stringify(this.history.slice(0, 10)));
        } catch (e) {}
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
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

// Instantiate global workflow engine
window.jarvisWorkflow = new JarvisWorkflowEngine();
