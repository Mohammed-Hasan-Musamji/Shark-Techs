/**
 * ============================================================================
 * J.A.R.V.I.S. AUDIO VIEW (V - MVC)
 * Procedural Web Audio API Sound Synthesis for authentic Sci-Fi UI Feedback
 * ============================================================================
 */

class AudioView {
    constructor(configModel) {
        this.config = configModel;
        this.ctx = null;
        this.initAudioContext();

        // Listen for config changes (mute/unmute)
        this.config.subscribe((key) => {
            if (key === 'sound_muted_changed' || key === 'reset_defaults') {
                this.updateMuteIcon();
            }
        });
    }

    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        } catch (e) {
            console.warn('Web Audio API not supported on this device.', e);
        }
    }

    ensureContext() {
        if (!this.ctx) {
            this.initAudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    isMuted() {
        return this.config.soundMuted;
    }

    updateMuteIcon() {
        const soundIcon = document.getElementById('soundIcon');
        const btnSoundToggle = document.getElementById('btnSoundToggle');
        const muted = this.isMuted();
        if (soundIcon) soundIcon.textContent = muted ? '🔇' : '🔊';
        if (btnSoundToggle) btnSoundToggle.title = muted ? 'Unmute Audio SFX' : 'Mute Audio SFX';
    }

    playClick() {
        if (this.isMuted()) return;
        this.ensureContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playWakePing() {
        if (this.isMuted()) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playProcessComplete() {
        if (this.isMuted()) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playProtocolEngaged() {
        if (this.isMuted()) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.42);
    }

    playAlert() {
        if (this.isMuted()) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + (i * 0.18);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, start);
            osc.frequency.linearRampToValueAtTime(500, start + 0.15);

            gain.gain.setValueAtTime(0.15, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.16);
        }
    }
}
