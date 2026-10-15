/**
 * ============================================================================
 * J.A.R.V.I.S. TELEMETRY VIEW (V - MVC)
 * Power, Network, Neural Load, Atmospheric Weather Card & Telemetry Logs Feed
 * ============================================================================
 */

class TelemetryView {
    constructor(telemetryModel, systemBridgeModel) {
        this.telemetry = telemetryModel;
        this.bridge = systemBridgeModel;

        this.powerStatus = document.getElementById('powerStatus');
        this.powerBar = document.getElementById('powerBar');

        this.netStatus = document.getElementById('netStatus');
        this.netBar = document.getElementById('netBar');

        this.coreLoad = document.getElementById('coreLoad');
        this.coreLoadBar = document.getElementById('coreLoadBar');

        this.weatherLoc = document.getElementById('weatherLoc');
        this.weatherTemp = document.getElementById('weatherTemp');
        this.weatherDesc = document.getElementById('weatherDesc');
        this.weatherWind = document.getElementById('weatherWind');
        this.weatherHumidity = document.getElementById('weatherHumidity');

        this.telemetryLogs = document.getElementById('telemetryLogs');

        // Subscribe to TelemetryModel updates
        this.telemetry.subscribe((type, data) => {
            if (type === 'battery_updated') this.renderBattery(data);
            if (type === 'network_updated') this.renderNetwork(data);
            if (type === 'core_load_updated') this.renderCoreLoad(data);
            if (type === 'weather_updated') this.renderWeather(data);
            if (type === 'log_appended') this.renderLog(data);
            if (type === 'logs_cleared') this.clearLogs();
        });

        // Subscribe to Real System Bridge Telemetry
        if (this.bridge) {
            this.bridge.subscribe((type, data) => {
                if (type === 'stats_updated') {
                    if (this.coreLoad && data.cpuLoad !== undefined) {
                        this.coreLoad.textContent = `${data.cpuLoad}% CPU | ${data.ramPercent}% RAM`;
                    }
                    if (this.coreLoadBar && data.cpuLoad !== undefined) {
                        this.coreLoadBar.style.width = `${Math.min(100, Math.max(10, data.cpuLoad))}%`;
                    }
                }
            });
        }
    }

    renderBattery(battery) {
        if (!this.powerStatus || !this.powerBar) return;
        if (battery.supported) {
            this.powerStatus.textContent = `${battery.level}% ${battery.charging ? '⚡ CHARGING' : 'DISCHARGING'}`;
            this.powerBar.style.width = `${battery.level}%`;
        } else {
            this.powerStatus.textContent = '100% ARC CELL';
            this.powerBar.style.width = '100%';
        }
    }

    renderNetwork(network) {
        if (!this.netStatus || !this.netBar) return;
        if (network.online) {
            this.netStatus.textContent = 'ONLINE (1000 Mbps)';
            this.netStatus.style.color = 'var(--primary-glow)';
            this.netBar.style.width = '100%';
        } else {
            this.netStatus.textContent = 'OFFLINE (LOCAL BUFFER)';
            this.netStatus.style.color = '#ff3366';
            this.netBar.style.width = '15%';
        }
    }

    renderCoreLoad(val) {
        if (this.coreLoad) this.coreLoad.textContent = `${val}% OPTIMAL`;
        if (this.coreLoadBar) this.coreLoadBar.style.width = `${val}%`;
    }

    renderWeather(w) {
        if (!w || !w.loaded) return;
        const iconEl = document.getElementById('weatherIcon');
        if (iconEl && w.icon) iconEl.textContent = w.icon;
        if (this.weatherLoc) this.weatherLoc.textContent = (w.city || 'LOCAL STATION').toUpperCase();
        if (this.weatherTemp) this.weatherTemp.textContent = `${w.tempC}°C`;
        if (this.weatherDesc) {
            const feels = w.feelsLike !== null && w.feelsLike !== undefined ? w.feelsLike : w.tempC;
            this.weatherDesc.textContent = `${w.condition || 'Clear Sky'} | Feels like ${feels}°C | Humidity: ${w.humidity || '45%'} | Wind: ${w.windSpeed || '10 km/h'}`;
        }
    }

    renderLog(logEntry) {
        if (!this.telemetryLogs) return;
        const div = document.createElement('div');
        div.className = 'telemetry-log-item';
        div.innerHTML = `<span class="log-time">[${logEntry.timestamp}]</span> <span class="log-text">${this.escapeHTML(logEntry.message)}</span>`;
        this.telemetryLogs.appendChild(div);
        this.telemetryLogs.scrollTop = this.telemetryLogs.scrollHeight;
    }

    clearLogs() {
        if (this.telemetryLogs) {
            this.telemetryLogs.innerHTML = '';
        }
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>'"]/g, 
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
