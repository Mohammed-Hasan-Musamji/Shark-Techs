/**
 * ============================================================================
 * J.A.R.V.I.S. SYSTEM BRIDGE MODEL (M - MVC)
 * Manages computer OS controls, mobile connection info & remote tunnel
 * ============================================================================
 */

class SystemBridgeModel {
    constructor() {
        this.subscribers = [];
        this.isBridgeAvailable = false;

        this.networkInfo = {
            primaryIp: '127.0.0.1',
            mobileUrl: 'http://localhost:9000',
            qrCodeUrl: '',
            isTunnelActive: false,
            remoteTunnelUrl: null
        };

        this.systemStats = {
            cpuLoad: 15.0,
            ramPercent: 50.0,
            ramDetails: { total: '16 GB', used: '8 GB', free: '8 GB' },
            hostname: 'HOST-PC',
            uptimeSeconds: 0
        };

        this.lastScreenshot = null;
        this.apiBase = this.resolveApiBase();

        // Auto-check bridge and start polling
        this.init();
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

    notify(type, data) {
        this.subscribers.forEach(cb => cb(type, data, this));
    }

    async init() {
        await this.fetchNetworkInfo();
        await this.fetchSystemStats();

        // Poll system stats every 4 seconds
        setInterval(() => {
            this.fetchSystemStats();
        }, 4000);
    }

    async fetchNetworkInfo() {
        try {
            const res = await fetch(`${this.apiBase}/api/network-info`);
            if (res.ok) {
                const data = await res.json();
                this.isBridgeAvailable = true;
                this.networkInfo = {
                    primaryIp: data.primaryIp,
                    mobileUrl: data.mobileUrl,
                    qrCodeUrl: data.qrCodeUrl,
                    isTunnelActive: data.isTunnelActive,
                    remoteTunnelUrl: data.remoteTunnelUrl
                };
                this.notify('network_info_updated', this.networkInfo);
                return this.networkInfo;
            }
        } catch (e) {
            // Running without backend server
            this.isBridgeAvailable = false;
        }
        return this.networkInfo;
    }

    async fetchSystemStats() {
        try {
            const res = await fetch(`${this.apiBase}/api/system/stats`);
            if (res.ok) {
                const data = await res.json();
                this.isBridgeAvailable = true;
                this.systemStats = {
                    cpuLoad: data.cpuLoad,
                    ramPercent: data.ramPercent,
                    ramDetails: data.ramDetails,
                    hostname: data.hostname,
                    uptimeSeconds: data.uptimeSeconds
                };
                this.notify('stats_updated', this.systemStats);
                return this.systemStats;
            }
        } catch (e) {
            // Static file or bridge unavailable
        }
        return this.systemStats;
    }

    async openApp(appName) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/open-app`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app: appName })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'open_app', app: appName, data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async openUrl(url) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/open-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'open_url', url, data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async controlVolume(action) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/volume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'volume', data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async lockWorkstation() {
        try {
            const res = await fetch(`${this.apiBase}/api/system/lock`, { method: 'POST' });
            const data = await res.json();
            this.notify('action_completed', { action: 'lock', data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async captureScreenshot() {
        try {
            const res = await fetch(`${this.apiBase}/api/system/screenshot`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.image) {
                    this.lastScreenshot = data.image;
                    this.notify('screenshot_ready', data.image);
                    return data;
                }
            }
            throw new Error('Screenshot acquisition failed');
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async executeTerminal(command) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            const data = await res.json();
            this.notify('command_executed', data);
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async searchWeb(query, engine = 'google', fallbackUrl = '') {
        try {
            const res = await fetch(`${this.apiBase}/api/system/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, engine })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'search', query, engine, data });
            return data;
        } catch (e) {
            if (fallbackUrl) {
                try { window.open(fallbackUrl, '_blank'); } catch (err) {}
            }
            return { success: false, error: e.message };
        }
    }

    async openAppWithText(app, text) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/open-app`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app, text })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'open_app_text', app, text, data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async typeText(text) {
        try {
            const res = await fetch(`${this.apiBase}/api/system/type`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            this.notify('action_completed', { action: 'type_text', text, data });
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async getConversationHistory() {
        try {
            const res = await fetch(`${this.apiBase}/api/history`);
            if (res.ok) {
                const data = await res.json();
                return data.messages || [];
            }
        } catch (e) {
            console.warn('Could not fetch MongoDB conversation history:', e.message);
        }
        return [];
    }

    async saveConversationMessage(message) {
        try {
            const res = await fetch(`${this.apiBase}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            // bridge offline
        }
        return null;
    }

    async exportConversationHistory(format = 'markdown') {
        const url = `${this.apiBase}/api/history/export?format=${encodeURIComponent(format)}`;
        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = format === 'json' ? 'jarvis_history.json' : 'jarvis_transcript.md';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (e) {
            window.open(url, '_blank');
            return true;
        }
    }

    async clearConversationHistory() {
        try {
            const res = await fetch(`${this.apiBase}/api/history`, { method: 'DELETE' });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    async toggleRemoteTunnel() {
        try {
            const res = await fetch(`${this.apiBase}/api/tunnel/toggle`, { method: 'POST' });
            const data = await res.json();
            this.networkInfo.isTunnelActive = data.active;
            this.networkInfo.remoteTunnelUrl = data.tunnelUrl || null;
            if (data.qrCodeUrl) this.networkInfo.qrCodeUrl = data.qrCodeUrl;
            this.notify('tunnel_updated', data);
            return data;
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}
