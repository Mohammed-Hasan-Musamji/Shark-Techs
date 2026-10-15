/**
 * ============================================================================
 * J.A.R.V.I.S. CONVERSATION MODEL (M - MVC)
 * Manages holographic transmission feed, MongoDB history & multi-turn LLM context
 * ============================================================================
 */

class ConversationModel {
    constructor() {
        this.subscribers = [];
        this.messages = [];
        this.history = []; // Multi-turn memory buffer for Groq/OpenAI completions
        this.maxHistory = 12;
        this.apiBase = this.resolveApiBase();

        // Initialize greeting message
        this.initWelcomeMessage();

        // Load historical dialogues from MongoDB
        this.loadRemoteHistory();
    }

    resolveApiBase() {
        if (typeof window === 'undefined') return 'http://localhost:9000';
        if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '9000')) {
            return 'http://localhost:9000';
        }
        return '';
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(action, data) {
        this.subscribers.forEach(cb => cb(action, data, this));
    }

    initWelcomeMessage() {
        const welcome = {
            id: Date.now(),
            role: 'jarvis',
            sender: 'J.A.R.V.I.S.',
            badge: 'ONLINE',
            text: 'Good day, Sir. Systems are online, Arc Reactor is optimal, and all defense telemetry channels are standing by.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: false
        };
        this.messages.push(welcome);
    }

    async loadRemoteHistory() {
        try {
            const res = await fetch(`${this.apiBase}/api/history`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    // Populate loaded messages from MongoDB
                    this.messages = data.messages;
                    this.notify('history_loaded', this.messages);
                }
            }
        } catch (e) {
            // bridge offline, use local memory
        }
    }

    getMessages() {
        return [...this.messages];
    }

    getHistory() {
        return [...this.history];
    }

    addMessage(role, text, isError = false) {
        const activeUserName = (localStorage.getItem('jarvis_user_name') || 'TONY STARK').toUpperCase();
        const sender = role === 'user' ? activeUserName : 'J.A.R.V.I.S.';
        const badge = role === 'user' ? 'COMMAND' : (isError ? 'ALERT' : 'ONLINE');

        const message = {
            id: Date.now() + Math.random(),
            role,
            sender,
            badge,
            text,
            timestamp,
            isError
        };

        this.messages.push(message);

        // Keep multi-turn context clean
        if (!isError) {
            this.history.push({
                role: role === 'user' ? 'user' : 'assistant',
                content: text
            });
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }

        // Notify views
        this.notify('message_added', message);

        // Asynchronously save to MongoDB database in background
        this.persistMessageToDatabase(message);

        return message;
    }

    async persistMessageToDatabase(msg) {
        try {
            await fetch(`${this.apiBase}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            });
        } catch (e) {
            // offline
        }
    }

    async clear() {
        this.messages = [];
        this.history = [];
        const purged = {
            id: Date.now(),
            role: 'jarvis',
            sender: 'J.A.R.V.I.S.',
            badge: 'ONLINE',
            text: 'Transmission feed purged. Systems standing by.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: false
        };
        this.messages.push(purged);
        this.notify('feed_cleared', purged);

        try {
            await fetch(`${this.apiBase}/api/history`, { method: 'DELETE' });
        } catch (e) {}
    }
}
