/**
 * ============================================================================
 * J.A.R.V.I.S. DEVICE APPS & NATIVE LAUNCHER CONTROLLER
 * Smoothly opens local device applications (WhatsApp, Notepad, Calculator, VS Code, Spotify, etc.)
 * ============================================================================
 */

class JarvisDeviceController {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('J.A.R.V.I.S. Device Apps & Native Controller Initialized.');
    }

    setupEventListeners() {
        // App Launcher Grid Buttons in HUD
        document.querySelectorAll('.device-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const app = btn.getAttribute('data-app');
                this.launchApp(app);
            });
        });

        // Notepad Modal Actions
        const btnCloseNotepad = document.getElementById('btnCloseNotepad');
        const notepadBackdrop = document.getElementById('notepadModalBackdrop');
        if (btnCloseNotepad) btnCloseNotepad.addEventListener('click', () => this.closeNotepad());
        if (notepadBackdrop) notepadBackdrop.addEventListener('click', () => this.closeNotepad());

        const btnSaveNotepadFile = document.getElementById('btnSaveNotepadFile');
        if (btnSaveNotepadFile) {
            btnSaveNotepadFile.addEventListener('click', () => this.saveNotepadFile());
        }

        const btnCopyNotepad = document.getElementById('btnCopyNotepad');
        if (btnCopyNotepad) {
            btnCopyNotepad.addEventListener('click', () => this.copyNotepadContent());
        }

        const btnClearNotepad = document.getElementById('btnClearNotepad');
        if (btnClearNotepad) {
            btnClearNotepad.addEventListener('click', () => {
                const area = document.getElementById('desktopNotepadTextarea');
                if (area) {
                    area.value = '';
                    this.updateNotepadStats();
                }
            });
        }

        const notepadArea = document.getElementById('desktopNotepadTextarea');
        if (notepadArea) {
            notepadArea.addEventListener('input', () => this.updateNotepadStats());
        }
    }

    /**
     * System Control Bridge Uplink: Communicates with local host server if running (port 9000)
     */
    async callBridge(endpoint, data) {
        const baseUrls = [
            window.location.origin,
            'http://localhost:9000',
            'http://127.0.0.1:9000'
        ];
        for (const base of baseUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200);
                const res = await fetch(`${base}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const result = await res.json();
                    if (result && result.success) return result;
                }
            } catch (e) {
                // Ignore and proceed to fallback
            }
        }
        return null;
    }

    /**
     * Contact Directory Management
     */
    getContacts() {
        try {
            const raw = localStorage.getItem('jarvis_contacts');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            'hasan': { name: 'Hasan', phone: '' }
        };
    }

    saveContact(name, phone) {
        if (!name) return false;
        const contacts = this.getContacts();
        const key = name.toLowerCase().trim();
        const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
        contacts[key] = {
            name: name.trim(),
            phone: cleanPhone
        };
        try {
            localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
        } catch (e) {}
        return contacts[key];
    }

    lookupContact(name) {
        if (!name) return null;
        const contacts = this.getContacts();
        const key = name.toLowerCase().trim();
        if (contacts[key]) return contacts[key];
        for (const k of Object.keys(contacts)) {
            if (k.includes(key) || key.includes(k)) return contacts[k];
        }
        return null;
    }

    /**
     * Master Launcher: Opens apps with protocol fallbacks and smooth execution
     */
    launchApp(appName, params = {}) {
        const app = (appName || '').toLowerCase().trim();
        if (window.jarvisSound) window.jarvisSound.playProcessComplete();

        switch (app) {
            case 'whatsapp':
                return this.openWhatsApp(params.text || params.message || '', params.phone, params.contact || params.recipient);

            case 'notepad':
                return this.openNotepad(params.text || params.content || '');

            case 'calculator':
                return this.openCalculator(params.expression);

            case 'vscode':
            case 'code':
                return this.openVSCode(params.path);

            case 'spotify':
                return this.openSpotify(params.query || params.song || params.artist);

            case 'youtube':
                return this.openYouTube(params.query);

            case 'maps':
            case 'google maps':
                return this.openMaps(params.location || params.query);

            case 'settings':
            case 'windows settings':
                return this.openSettings();

            case 'paint':
                return this.openPaint();

            case 'clock':
            case 'alarms':
                return this.openClock();

            case 'email':
            case 'mail':
            case 'outlook':
                return this.openEmail(params.to, params.subject, params.body);

            default:
                return this.openGenericApp(appName, params);
        }
    }

    /* --------------------------------------------------------------------------
       1. WHATSAPP LAUNCHER
       -------------------------------------------------------------------------- */
    openWhatsApp(message = '', phone = '', recipientName = '') {
        let targetPhone = phone;
        let displayName = recipientName;

        // Check contact directory if recipient is provided without direct phone
        if (recipientName && !targetPhone) {
            const found = this.lookupContact(recipientName);
            if (found && found.phone) {
                targetPhone = found.phone;
                displayName = found.name || recipientName;
            }
        }

        const cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(message);
        let appUri = `whatsapp://send?text=${encodedMsg}`;
        let webUrl = `https://web.whatsapp.com/send?text=${encodedMsg}`;

        if (cleanPhone) {
            appUri = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
            webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
        } else if (!message) {
            appUri = 'whatsapp://';
            webUrl = 'https://web.whatsapp.com';
        }

        // Try host PC bridge first (if Node.js server is online)
        this.callBridge('/api/system/open-app', {
            app: 'whatsapp',
            text: message,
            phone: cleanPhone
        }).then(bridgeRes => {
            if (bridgeRes && window.jarvisAgent) {
                window.jarvisAgent.appendTelemetryLog(`[BRIDGE] WhatsApp dispatched via host bridge.`);
            }
        });

        // Trigger native desktop protocol with prompt web fallback
        this.launchProtocolWithFallback(appUri, webUrl, 'WhatsApp');

        const userName = window.jarvisApp?.getUserName() || 'Harsh';
        let feedback = '';

        if (displayName) {
            if (cleanPhone) {
                feedback = `Opening WhatsApp chat with ${displayName} to send: "${message || 'hi'}", ${userName}.`;
            } else {
                feedback = `Opening WhatsApp with message "${message || 'hi'}" prepared for ${displayName}, ${userName}. Select ${displayName} to send. (Tip: say "save contact ${displayName} [phone]" to link directly!)`;
            }
        } else if (message) {
            feedback = `Opening WhatsApp with message: "${message.slice(0, 40)}...", ${userName}.`;
        } else {
            feedback = `Opening WhatsApp application for you now, ${userName}.`;
        }

        if (window.jarvisAgent) window.jarvisAgent.appendTelemetryLog(`[APP LAUNCH] ${feedback}`);
        return feedback;
    }

    /* --------------------------------------------------------------------------
       2. NOTEPAD LAUNCHER & HUD DESKTOP WORKSPACE
       -------------------------------------------------------------------------- */
    openNotepad(initialText = '') {
        const modal = document.getElementById('notepadModal');
        const area = document.getElementById('desktopNotepadTextarea');

        // 1. If PC Bridge is running, tell bridge to launch native Windows Notepad with this text
        this.callBridge('/api/system/open-app', {
            app: 'notepad',
            text: initialText
        }).then(bridgeRes => {
            if (bridgeRes && window.jarvisAgent) {
                window.jarvisAgent.appendTelemetryLog(`[BRIDGE] Native Windows Notepad launched with text.`);
            }
        });

        // 2. Open Desktop Notepad workspace inside the HUD
        if (modal && area) {
            if (initialText) {
                if (area.value) {
                    area.value += `\n\n[${new Date().toLocaleTimeString()}]\n${initialText}`;
                } else {
                    area.value = initialText;
                }
            }
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            this.updateNotepadStats();

            setTimeout(() => {
                area.focus();
                area.setSelectionRange(area.value.length, area.value.length);
            }, 100);
        }

        // 3. Auto-copy text to clipboard for instant pasting anywhere
        if (initialText && navigator.clipboard) {
            navigator.clipboard.writeText(initialText).catch(() => {});
        }

        // 4. Also trigger instant .txt download for native Windows Notepad
        if (initialText) {
            this.promptNativeNotepadOpen(initialText);
        }

        const userName = window.jarvisApp?.getUserName() || 'Harsh';
        const feedback = initialText 
            ? `Opening Notepad workspace with your text: "${initialText.slice(0, 35)}...", ${userName}.`
            : `Opening Desktop Notepad workspace for you now, ${userName}.`;

        if (window.jarvisAgent) {
            window.jarvisAgent.appendTelemetryLog(`[APP LAUNCH] Desktop Notepad workspace active.`);
        }
        return feedback;
    }

    closeNotepad() {
        const modal = document.getElementById('notepadModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            if (window.jarvisSound) window.jarvisSound.playClick();
        }
    }

    saveNotepadFile() {
        const area = document.getElementById('desktopNotepadTextarea');
        const text = area ? area.value : '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `notes_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.jarvisSound) window.jarvisSound.playProcessComplete();
        if (window.jarvisAgent) {
            window.jarvisAgent.appendTelemetryLog(`Notepad file saved and downloaded as notes_${timestamp}.txt`);
        }
    }

    copyNotepadContent() {
        const area = document.getElementById('desktopNotepadTextarea');
        if (area && area.value) {
            navigator.clipboard.writeText(area.value).then(() => {
                if (window.jarvisApp) window.jarvisApp.flashStatus('NOTEPAD COPIED', '#00f0ff');
                if (window.jarvisSound) window.jarvisSound.playProcessComplete();
            });
        }
    }

    promptNativeNotepadOpen(text) {
        // Download a quick temp note that can be opened in native Windows Notepad with one click
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jarvis_notepad.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateNotepadStats() {
        const area = document.getElementById('desktopNotepadTextarea');
        const statsEl = document.getElementById('notepadStatusBar');
        if (!area || !statsEl) return;

        const val = area.value;
        const chars = val.length;
        const lines = val ? val.split('\n').length : 1;
        const words = val.trim() ? val.trim().split(/\s+/).length : 0;

        statsEl.textContent = `Lines: ${lines} | Words: ${words} | Characters: ${chars} | UTF-8`;
    }

    /* --------------------------------------------------------------------------
       3. CALCULATOR LAUNCHER
       -------------------------------------------------------------------------- */
    openCalculator(expression = '') {
        // ms-calculator: is the official Windows Calculator protocol
        this.launchProtocolWithFallback('ms-calculator:', 'https://www.google.com/search?q=calculator', 'Windows Calculator');

        if (expression) {
            try {
                // eslint-disable-next-line no-eval
                const clean = expression.replace(/times/g, '*').replace(/divided by/g, '/').replace(/plus/g, '+').replace(/minus/g, '-');
                if (/^[\d\s+\-*/().%]+$/.test(clean)) {
                    const result = Function(`'use strict'; return (${clean})`)();
                    return `Launching Windows Calculator. Computed ${clean} = ${result}, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
                }
            } catch (e) {}
        }

        return `Launching Windows Calculator application, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /* --------------------------------------------------------------------------
       4. VISUAL STUDIO CODE LAUNCHER
       -------------------------------------------------------------------------- */
    openVSCode(path = '') {
        const uri = path ? `vscode://file/${encodeURIComponent(path)}` : 'vscode://';
        this.launchProtocolWithFallback(uri, 'https://vscode.dev', 'VS Code');
        return `Opening Visual Studio Code smoothly, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /* --------------------------------------------------------------------------
       5. SPOTIFY LAUNCHER
       -------------------------------------------------------------------------- */
    openSpotify(query = '') {
        const uri = query ? `spotify:search:${encodeURIComponent(query)}` : 'spotify:';
        const webUrl = query 
            ? `https://open.spotify.com/search/${encodeURIComponent(query)}` 
            : 'https://open.spotify.com';

        this.launchProtocolWithFallback(uri, webUrl, 'Spotify');
        return query 
            ? `Opening Spotify and searching for "${query}", ${window.jarvisApp?.getUserName() || 'Harsh'}.`
            : `Launching Spotify music player, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /* --------------------------------------------------------------------------
       6. YOUTUBE LAUNCHER
       -------------------------------------------------------------------------- */
    openYouTube(query = '') {
        const url = query 
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` 
            : 'https://www.youtube.com';
        window.open(url, '_blank');
        return query 
            ? `Opening YouTube and searching for "${query}", ${window.jarvisApp?.getUserName() || 'Harsh'}.`
            : `Opening YouTube in new viewport, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /* --------------------------------------------------------------------------
       7. GOOGLE MAPS LAUNCHER
       -------------------------------------------------------------------------- */
    openMaps(location = '') {
        const url = location 
            ? `https://www.google.com/maps/search/${encodeURIComponent(location)}` 
            : 'https://www.google.com/maps';
        window.open(url, '_blank');
        return `Opening Google Maps for "${location || 'navigation'}", ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /* --------------------------------------------------------------------------
       8. WINDOWS SETTINGS & SYSTEM APPS
       -------------------------------------------------------------------------- */
    openSettings() {
        this.launchProtocolWithFallback('ms-settings:', null, 'Windows Settings');
        return `Opening Windows Settings app, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    openPaint() {
        this.launchProtocolWithFallback('ms-paint:', null, 'Microsoft Paint');
        return `Opening Microsoft Paint, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    openClock() {
        this.launchProtocolWithFallback('ms-clock:', null, 'Windows Clock & Alarms');
        return `Opening Windows Clock and Alarms, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    openEmail(to = '', subject = '', body = '') {
        const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        return `Opening your default email client, ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    openGenericApp(appName, params) {
        // Fallback search or application lookup
        window.open(`https://www.google.com/search?q=${encodeURIComponent(appName)}`, '_blank');
        return `Searching device application catalog for "${appName}", ${window.jarvisApp?.getUserName() || 'Harsh'}.`;
    }

    /**
     * Seamless protocol launcher: executes protocol smoothly without blank page artifacts
     */
    launchProtocolWithFallback(protocolUri, fallbackWebUrl, appDisplayName) {
        // Create invisible iframe to trigger the protocol handler cleanly
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);

        let didLaunch = false;
        try {
            iframe.contentWindow.location.href = protocolUri;
            didLaunch = true;
        } catch (e) {
            console.warn(`Protocol execution failed for ${protocolUri}:`, e);
        }

        // Clean up iframe after 2 seconds
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2500);

        // If a web URL fallback exists and browser didn't switch focus, open fallback
        if (fallbackWebUrl) {
            setTimeout(() => {
                // If page remains focused, user might not have native protocol installed
                if (document.hasFocus()) {
                    window.open(fallbackWebUrl, '_blank');
                }
            }, 800);
        }

        if (window.jarvisApp) {
            window.jarvisApp.flashStatus(`${appDisplayName.toUpperCase()} LAUNCHED`, '#00f0ff');
        }
    }
}

// Instantiate global device controller
window.jarvisDevice = new JarvisDeviceController();
