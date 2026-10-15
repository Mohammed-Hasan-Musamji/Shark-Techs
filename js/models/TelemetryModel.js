/**
 * ============================================================================
 * J.A.R.V.I.S. TELEMETRY MODEL (M - MVC)
 * Manages live sensor data: real geolocation, weather, hardware, and modes
 * ============================================================================
 */

class TelemetryModel {
    constructor() {
        this.subscribers = [];

        // Real Hardware & Environment Telemetry
        this.battery = { level: 100, charging: true, supported: false };
        this.network = { online: navigator.onLine, ping: '12ms' };
        this.uptimeSeconds = 0;
        this.coreLoad = 98.4;
        this.currentProtocol = 'standby'; // 'standby' | 'focus' | 'stealth' | 'diagnostic' | 'voice-loop'
        
        this.hardware = {
            cores: navigator.hardwareConcurrency || 8,
            platform: navigator.platform || 'Win32',
            memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Optimal'
        };

        this.weather = {
            loaded: false,
            tempC: null,
            tempF: null,
            feelsLike: null,
            condition: 'Clear Sky',
            icon: '☀️',
            weatherCode: 0,
            windSpeed: null,
            humidity: null,
            city: 'Detecting Real Location...'
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

    setPing(pingText) {
        this.network.ping = pingText;
        this.notify('ping_updated', pingText);
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

    /**
     * Resolves the user's real geographic location via IP API or Browser Geolocation
     */
    async resolveRealLocation() {
        const cached = localStorage.getItem('jarvis_real_location');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.lat && parsed.lon && parsed.city) {
                    return parsed;
                }
            } catch (e) {}
        }

        // Fast IP geolocation lookup (CORS friendly, zero key needed)
        try {
            const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (ipRes.ok) {
                const data = await ipRes.json();
                if (data.latitude && data.longitude) {
                    const loc = {
                        city: data.city || data.region || 'Local Station',
                        country: data.country || '',
                        lat: parseFloat(data.latitude),
                        lon: parseFloat(data.longitude)
                    };
                    localStorage.setItem('jarvis_real_location', JSON.stringify(loc));
                    return loc;
                }
            }
        } catch (e) {
            console.warn('IP geolocation lookup fallback:', e);
        }

        // HTML5 Geolocation fallback
        if (navigator.geolocation) {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const loc = {
                            city: 'Your Station',
                            country: '',
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude
                        };
                        localStorage.setItem('jarvis_real_location', JSON.stringify(loc));
                        resolve(loc);
                    },
                    () => {
                        resolve({ city: 'Local Area', country: '', lat: 28.6139, lon: 77.2090 });
                    },
                    { timeout: 5000 }
                );
            });
        }

        return { city: 'Local Area', country: '', lat: 28.6139, lon: 77.2090 };
    }

    /**
     * Atmospheric scan using user's real geographic coordinates
     */
    async fetchLiveWeather() {
        this.appendLog('[WEATHER] Acquiring real geographic location...');
        try {
            const loc = await this.resolveRealLocation();
            const locationTitle = loc.country ? `${loc.city}, ${loc.country}`.toUpperCase() : loc.city.toUpperCase();

            this.appendLog(`[WEATHER] Atmospheric sensors synchronizing for ${locationTitle}...`);
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&temperature_unit=celsius`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Atmospheric scan returned HTTP ${res.status}`);
            const data = await res.json();

            const cur = data.current;
            const tempC = Math.round(cur.temperature_2m);
            const tempF = Math.round((tempC * 9/5) + 32);
            const feelsLike = Math.round(cur.apparent_temperature || tempC);
            const wind = Math.round(cur.wind_speed_10m);
            const humidity = cur.relative_humidity_2m;
            const code = cur.weather_code;

            let condition = 'Clear Sky';
            let icon = '☀️';
            if ([1, 2, 3].includes(code)) {
                condition = code === 1 ? 'Mainly Clear' : (code === 2 ? 'Partly Cloudy' : 'Overcast');
                icon = '⛅';
            } else if ([45, 48].includes(code)) {
                condition = 'Fog / Mist';
                icon = '🌫️';
            } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
                condition = 'Rain / Showers';
                icon = '🌧️';
            } else if ([71, 73, 75, 85, 86].includes(code)) {
                condition = 'Snow / Ice';
                icon = '❄️';
            } else if ([95, 96, 99].includes(code)) {
                condition = 'Thunderstorm';
                icon = '⛈️';
            }

            const weatherPayload = {
                tempC,
                tempF,
                feelsLike,
                condition,
                icon,
                windSpeed: `${wind} km/h`,
                weatherCode: code,
                humidity: `${humidity}%`,
                city: locationTitle
            };

            this.setWeather(weatherPayload);
            this.appendLog(`[WEATHER] Real-time parameters locked: ${tempC}°C, ${condition}, Humidity: ${humidity}%, Wind: ${wind} km/h (${locationTitle}).`);
            return weatherPayload;
        } catch (e) {
            console.warn('Weather telemetry fetch failed:', e);
            const fallback = {
                tempC: 24,
                tempF: 75,
                feelsLike: 24,
                condition: 'Clear Sky',
                icon: '☀️',
                windSpeed: '12 km/h',
                weatherCode: 0,
                humidity: '48%',
                city: 'Local Area'
            };
            this.setWeather(fallback);
            this.appendLog('[WEATHER] Satellite telemetry unavailable. Reverting to backup atmospheric cache.');
            return fallback;
        }
    }
}
