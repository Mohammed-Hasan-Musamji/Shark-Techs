/**
 * ============================================================================
 * J.A.R.V.I.S. CONVERSATION MODEL (M - MVC)
 * Manages the message transmission feed and multi-turn LLM reasoning context
 * ============================================================================
 */

class ConversationModel {
    constructor() {
        this.subscribers = [];
        this.messages = [];
        this.history = []; // Multi-turn memory buffer for Groq/OpenAI completions
        this.maxHistory = 12;

        // Initialize greeting message
        this.initWelcomeMessage();
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

    getMessages() {
        return [...this.messages];
    }

    getHistory() {
        return [...this.history];
    }

    addMessage(role, text, isError = false) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sender = role === 'user' ? 'TONY STARK' : 'J.A.R.V.I.S.';
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

        this.notify('message_added', message);
        return message;
    }

    clear() {
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
    }
}
