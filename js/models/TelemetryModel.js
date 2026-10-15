/**
 * ============================================================================
 * J.A.R.V.I.S. TELEMETRY MODEL (M - MVC)
 * Manages live sensor data: battery, network, weather, protocols & system telemetry
 * ============================================================================
 */

class TelemetryModel {
    constructor() {
        this.subscribers = [];

        // Telemetry State
        this.battery = { level: 100, charging: true, supported: false };
        this.network = { online: navigator.onLine, ping: 12 };
        this.uptimeSeconds = 0;
        this.coreLoad = 98.4;
        this.currentProtocol = 'standby'; // 'standby' | 'red-alert' | 'house-party' | 'stealth' | 'diagnostics'
        this.weather = {
            loaded: false,
            temp: null,
            weatherCode: null,
            windSpeed: null,
            humidity: null,
            city: 'Stark Tower, Malibu'
        };
        this.logs = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(type, data) {
        this.subscribers.forEach(cb => cb(type, data, this));
    }

    setBattery(level, charging, supported = true) {
        this.battery = { level, charging, supported };
        this.notify('battery_updated', this.battery);
    }

    setNetworkOnline(isOnline) {
        this.network.online = isOnline;
        this.notify('network_updated', this.network);
    }

    setPing(pingMs) {
        this.network.ping = pingMs;
        this.notify('ping_updated', pingMs);
    }

    incrementUptime() {
        this.uptimeSeconds++;
        this.notify('uptime_updated', this.uptimeSeconds);
    }

    setCoreLoad(val) {
        this.coreLoad = val;
        this.notify('core_load_updated', this.coreLoad);
    }

    setProtocol(protocolName) {
        this.currentProtocol = protocolName;
        this.notify('protocol_changed', protocolName);
    }

    setWeather(weatherData) {
        this.weather = { ...this.weather, ...weatherData, loaded: true };
        this.notify('weather_updated', this.weather);
    }

    appendLog(message) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logEntry = { timestamp, message };
        this.logs.push(logEntry);
        if (this.logs.length > 100) this.logs.shift();
        this.notify('log_appended', logEntry);
    }

    clearLogs() {
        this.logs = [];
        this.notify('logs_cleared', null);
    }

    async fetchLiveWeather() {
        this.appendLog('[WEATHER] Establishing satellite uplink with atmospheric sensors...');
        try {
            // Default to Malibu coords (Tony Stark's residence)
            const lat = 34.0259;
            const lon = -118.7798;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Atmospheric scan returned HTTP ${res.status}`);
            const data = await res.json();

            const cur = data.current_weather;
            const tempC = Math.round(cur.temperature);
            const tempF = Math.round((tempC * 9/5) + 32);
            const wind = cur.windspeed;
            const code = cur.weathercode;

            // Get humidity
            let humidity = 45;
            if (data.hourly && data.hourly.relativehumidity_2m && data.hourly.relativehumidity_2m.length > 0) {
                humidity = data.hourly.relativehumidity_2m[0];
            }

            const weatherPayload = {
                tempC,
                tempF,
                windSpeed: `${wind} km/h`,
                weatherCode: code,
                humidity: `${humidity}%`,
                city: 'Malibu Coast Sector'
            };

            this.setWeather(weatherPayload);
            this.appendLog(`[WEATHER] Atmospheric parameters synchronized: ${tempC}°C / ${tempF}°F, Wind: ${wind} km/h, Humidity: ${humidity}%.`);
            return weatherPayload;
        } catch (e) {
            console.warn('Weather telemetry fetch failed:', e);
            const fallback = {
                tempC: 22,
                tempF: 72,
                windSpeed: '12 km/h',
                weatherCode: 0,
                humidity: '48%',
                city: 'Stark Tower'
            };
            this.setWeather(fallback);
            this.appendLog('[WEATHER] Satellite telemetry unavailable. Reverting to backup atmospheric cache.');
            return fallback;
        }
    }
}
