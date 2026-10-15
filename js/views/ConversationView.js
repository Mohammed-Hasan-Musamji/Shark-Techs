/**
 * ============================================================================
 * J.A.R.V.I.S. CONVERSATION VIEW (V - MVC)
 * Renders user commands and Jarvis responses into the holographic feed
 * ============================================================================
 */

class ConversationView {
    constructor(conversationModel) {
        this.conversation = conversationModel;
        this.streamEl = document.getElementById('conversationStream');

        // Subscribe to ConversationModel updates
        this.conversation.subscribe((action, data) => {
            if (action === 'message_added') {
                this.renderMessage(data);
            } else if (action === 'feed_cleared') {
                this.renderCleared(data);
            } else if (action === 'history_loaded') {
                this.renderHistory(data);
            }
        });
    }

    renderHistory(messages) {
        if (!this.streamEl) return;
        this.streamEl.innerHTML = '';
        messages.forEach(msg => this.renderMessage(msg));
    }

    renderMessage(msg) {
        if (!this.streamEl) return;

        const isUser = msg.role === 'user';
        const entry = document.createElement('div');
        entry.className = `message-entry ${isUser ? 'user-msg' : 'jarvis-msg'} ${msg.isError ? 'error-msg' : ''}`;

        const avatar = isUser ? 'STARK' : 'J';
        const formattedText = this.formatContent(msg.text);

        entry.innerHTML = `
            <div class="msg-avatar">${avatar}</div>
            <div class="msg-content">
                <div class="msg-sender">${msg.sender} <span class="msg-time">${msg.timestamp}</span></div>
                <div class="msg-body">${formattedText}</div>
            </div>
        `;

        this.streamEl.appendChild(entry);
        this.scrollToBottom();
    }

    renderCleared(welcomeMsg) {
        if (!this.streamEl) return;
        this.streamEl.innerHTML = `
            <div class="message-entry jarvis-msg">
                <div class="msg-avatar">J</div>
                <div class="msg-content">
                    <div class="msg-sender">${welcomeMsg.sender} <span class="msg-time">${welcomeMsg.timestamp}</span></div>
                    <div class="msg-body">${this.formatContent(welcomeMsg.text)}</div>
                </div>
            </div>
        `;
    }

    scrollToBottom() {
        if (!this.streamEl) return;
        setTimeout(() => {
            this.streamEl.scrollTop = this.streamEl.scrollHeight;
        }, 50);
    }

    formatContent(raw) {
        if (!raw) return '';
        // Escape HTML
        let text = raw.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );

        // Basic bold and code styling
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/`([^`]+)`/g, '<code class="hud-inline-code">$1</code>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }
}
