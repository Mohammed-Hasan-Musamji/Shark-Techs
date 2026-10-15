/**
 * ============================================================================
 * J.A.R.V.I.S. TELEMETRY CONTROLLER (C - MVC)
 * Manages sensor polling, battery/network observers, protocols & theme matrix
 * ============================================================================
 */

class TelemetryController {
    constructor(telemetryModel, configModel, hudView, telemetryView, audioView) {
        this.telemetry = telemetryModel;
        this.config = configModel;
        this.hud = hudView;
        this.view = telemetryView;
        this.audio = audioView;

        this.init();
    }

    init() {
        this.setupHardwareMonitors();
        this.setupTimers();
        this.setupEventListeners();
    }

    setupHardwareMonitors() {
        // Battery status
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                const update = () => {
                    const level = Math.round(battery.level * 100);
                    const charging = battery.charging;
                    this.telemetry.setBattery(level, charging, true);
                };
                update();
                battery.addEventListener('levelchange', update);
                battery.addEventListener('chargingchange', update);
            }).catch(() => {
                this.telemetry.setBattery(100, true, false);
            });
        } else {
            this.telemetry.setBattery(100, true, false);
        }

        // Network status
        const updateNetwork = () => {
            this.telemetry.setNetworkOnline(navigator.onLine);
        };
        window.addEventListener('online', updateNetwork);
        window.addEventListener('offline', updateNetwork);
        updateNetwork();
    }

    setupTimers() {
        // Clock & Real Ping Measurement
        this.hud.renderClock();
        setInterval(async () => {
            this.hud.renderClock();
            this.telemetry.incrementUptime();

            // Measure real HTTP ping to local server every 4 seconds
            if (this.telemetry.uptimeSeconds % 4 === 0) {
                const start = performance.now();
                try {
                    await fetch('/api/network-info', { method: 'HEAD', cache: 'no-store' });
                    const pingMs = Math.round(performance.now() - start);
                    this.telemetry.setPing(`${pingMs}ms`);
                } catch (e) {
                    this.telemetry.setPing('12ms');
                }
            }
        }, 1000);

        // Core Load Fluctuation
        setInterval(() => {
            const jitter = parseFloat((97.8 + Math.random() * 1.8).toFixed(1));
            this.telemetry.setCoreLoad(jitter);
        }, 3000);
    }

    setupEventListeners() {
        // 1. Modes & Protocol Buttons
        document.querySelectorAll('.protocol-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const protocol = btn.getAttribute('data-protocol');
                this.telemetry.setProtocol(protocol);

                if (protocol === 'diagnostic') {
                    this.audio.playProcessComplete();
                    if (window.jarvisAgent) {
                        window.jarvisAgent.handleCommand('system status');
                    }
                } else if (protocol === 'voice-loop') {
                    this.audio.playWakePing();
                    if (window.jarvisSpeech) {
                        window.jarvisSpeech.startListening();
                    }
                } else if (protocol === 'focus') {
                    this.audio.playProtocolEngaged();
                    this.telemetry.appendLog('[MODE] Focus Mode active: distraction suppression online.');
                } else if (protocol === 'stealth') {
                    this.audio.playProtocolEngaged();
                    this.telemetry.appendLog('[MODE] Night Mode active: luminance reduced.');
                } else if (protocol === 'red-alert') {
                    this.audio.playAlert();
                } else {
                    this.audio.playProtocolEngaged();
                }
                this.telemetry.appendLog(`[MODE] System state switched to: ${protocol.toUpperCase()}`);
            });
        });

        // 2. Theme Matrix Buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.config.setTheme(theme);
                this.audio.playClick();
                this.telemetry.appendLog(`[ARMOR] Matrix recalibrated to ${theme.replace('theme-', '').toUpperCase()}`);
            });
        });

        // 3. Weather Refresh Button
        const btnRefreshWeather = document.getElementById('btnRefreshWeather');
        if (btnRefreshWeather) {
            btnRefreshWeather.addEventListener('click', () => {
                this.audio.playClick();
                this.telemetry.fetchLiveWeather();
            });
        }

        // 4. Clear Telemetry Logs
        const btnClearTelem = document.getElementById('btnClearTelemetry');
        if (btnClearTelem) {
            btnClearTelem.addEventListener('click', () => {
                this.telemetry.clearLogs();
            });
        }
    }
}
