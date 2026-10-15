/**
 * ============================================================================
 * J.A.R.V.I.S. VISUALIZER VIEW (V - MVC)
 * Holographic Arc Reactor Multi-Ring Canvas Graphics & Oscilloscope Waveforms
 * ============================================================================
 */

class VisualizerView {
    constructor(configModel) {
        this.config = configModel;
        this.reactorCanvas = document.getElementById('reactorCanvas');
        this.reactorCtx = this.reactorCanvas ? this.reactorCanvas.getContext('2d') : null;

        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformCtx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null;

        // Visualizer internal state: 'standby' | 'listening' | 'processing' | 'speaking'
        this.state = 'standby';

        // Animation timing & rotation values
        this.rotInner = 0;
        this.rotMid = 0;
        this.rotOuter = 0;
        this.pulseTime = 0;

        // Particle dynamics
        this.particles = [];
        this.maxParticles = 36;
        this.initParticles();

        // Audio waveform buffer
        this.audioData = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            this.audioData[i] = 10;
        }

        this.updateThemeColors();

        // Subscribe to config theme updates
        this.config.subscribe((key) => {
            if (key === 'theme_changed' || key === 'reset_defaults') {
                this.updateThemeColors();
            }
        });

        // Start requestAnimationFrame loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    updateThemeColors() {
        const style = getComputedStyle(document.body);
        this.primaryGlow = style.getPropertyValue('--primary-glow').trim() || '#00f0ff';
        this.primaryAccent = style.getPropertyValue('--primary-accent').trim() || '#00b4d8';
        this.primaryDim = style.getPropertyValue('--primary-dim').trim() || 'rgba(0, 240, 255, 0.2)';
    }

    setState(newState) {
        this.state = newState;
        const banner = document.getElementById('agentStateBanner');
        const modeTag = banner ? banner.querySelector('.agent-mode-tag') : null;
        const modeDesc = banner ? banner.querySelector('.agent-mode-desc') : null;

        if (modeTag && modeDesc) {
            switch(newState) {
                case 'listening':
                    modeTag.textContent = 'LISTENING';
                    modeDesc.textContent = 'NEURAL SPEECH RECOGNITION ACTIVE';
                    break;
                case 'processing':
                    modeTag.textContent = 'PROCESSING';
                    modeDesc.textContent = 'COGNITIVE INTENT & LLM INFERENCE';
                    break;
                case 'speaking':
                    modeTag.textContent = 'VOCAL FEED';
                    modeDesc.textContent = 'SYNTHESIZING ACOUSTIC RESPONSE';
                    break;
                default:
                    modeTag.textContent = 'STANDBY';
                    modeDesc.textContent = 'MONITORING SENSOR & VOICE INPUT';
            }
        }
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                dist: 30 + Math.random() * 85,
                speed: 0.005 + Math.random() * 0.015,
                size: 1 + Math.random() * 2,
                alpha: 0.2 + Math.random() * 0.7,
                pulse: Math.random() * Math.PI
            });
        }
    }

    animate(timestamp) {
        this.pulseTime += 0.03;

        // Dynamic speed based on agent state
        let speedMult = 1.0;
        if (this.state === 'listening') speedMult = 2.4;
        else if (this.state === 'processing') speedMult = 4.2;
        else if (this.state === 'speaking') speedMult = 1.8;

        this.rotInner += 0.012 * speedMult;
        this.rotMid -= 0.007 * speedMult;
        this.rotOuter += 0.004 * speedMult;

        this.renderReactor();
        this.renderWaveform();

        requestAnimationFrame(this.animate);
    }

    renderReactor() {
        if (!this.reactorCtx || !this.reactorCanvas) return;
        const ctx = this.reactorCtx;
        const w = this.reactorCanvas.width;
        const h = this.reactorCanvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Core Pulse calculations
        const pulse = Math.sin(this.pulseTime) * 4;
        const coreRadius = 26 + (this.state === 'speaking' ? Math.sin(this.pulseTime * 2.5) * 8 : pulse);

        // 1. Core Radiant Glow
        const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 110);
        radGrad.addColorStop(0, this.primaryGlow);
        radGrad.addColorStop(0.3, this.primaryAccent);
        radGrad.addColorStop(0.7, this.primaryDim);
        radGrad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Center Vibranium Core
        ctx.save();
        ctx.shadowColor = this.primaryGlow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.primaryGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Inner Coil Segmented Ring (10 Arc Coils)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotInner);

        const coils = 10;
        const coilR = 52;
        for (let i = 0; i < coils; i++) {
            const angle = (i * (Math.PI * 2 / coils));
            ctx.save();
            ctx.rotate(angle);
            ctx.fillStyle = this.primaryGlow;
            ctx.shadowColor = this.primaryGlow;
            ctx.shadowBlur = 10;

            // Segment block
            ctx.fillRect(-6, -coilR - 6, 12, 12);

            // Metallic copper-style wrap tick
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(-1.5, -coilR - 5, 3, 10);
            ctx.restore();
        }

        // Inner Circle border
        ctx.strokeStyle = this.primaryAccent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, coilR - 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, coilR + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Middle Mechanical Gear Dials (Counter Rotating)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotMid);

        ctx.strokeStyle = this.primaryDim;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 78, 0, Math.PI * 2);
        ctx.stroke();

        // Segmented Dashes
        ctx.strokeStyle = this.primaryGlow;
        ctx.lineWidth = 2;
        const segCount = 24;
        for (let i = 0; i < segCount; i++) {
            if (i % 2 === 0) continue;
            const a = i * (Math.PI * 2 / segCount);
            ctx.beginPath();
            ctx.arc(0, 0, 78, a, a + 0.14);
            ctx.stroke();
        }
        ctx.restore();

        // 5. Outer HUD Reticle Ring with Degree Marks
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotOuter);

        ctx.strokeStyle = this.primaryAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 104, 0, Math.PI * 2);
        ctx.stroke();

        for (let deg = 0; deg < 360; deg += 15) {
            const rad = deg * (Math.PI / 180);
            const isMajor = deg % 45 === 0;
            const len = isMajor ? 8 : 4;
            const rStart = 104 - len;
            const rEnd = 104;

            ctx.strokeStyle = isMajor ? this.primaryGlow : this.primaryDim;
            ctx.lineWidth = isMajor ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(rad) * rStart, Math.sin(rad) * rStart);
            ctx.lineTo(Math.cos(rad) * rEnd, Math.sin(rad) * rEnd);
            ctx.stroke();
        }
        ctx.restore();

        // 6. Orbital Energy Particles
        ctx.save();
        ctx.translate(cx, cy);
        this.particles.forEach(p => {
            p.angle += p.speed * speedMult;
            p.pulse += 0.05;
            const currentAlpha = Math.max(0.1, Math.min(1, p.alpha + Math.sin(p.pulse) * 0.3));

            const px = Math.cos(p.angle) * p.dist;
            const py = Math.sin(p.angle) * p.dist;

            ctx.fillStyle = this.primaryGlow;
            ctx.globalAlpha = currentAlpha;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    renderWaveform() {
        if (!this.waveformCtx || !this.waveformCanvas) return;
        const ctx = this.waveformCtx;
        const w = this.waveformCanvas.width;
        const h = this.waveformCanvas.height;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Update simulated frequency amplitudes based on agent activity
        const isSpeaking = this.state === 'speaking';
        const isListening = this.state === 'listening';
        const isProcessing = this.state === 'processing';

        const step = w / this.audioData.length;

        ctx.save();
        ctx.strokeStyle = this.primaryGlow;
        ctx.shadowColor = this.primaryGlow;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < this.audioData.length; i++) {
            let amp = 2;
            if (isSpeaking) {
                amp = 8 + Math.sin(this.pulseTime * 3 + i * 0.4) * 14 + Math.random() * 8;
            } else if (isListening) {
                amp = 4 + Math.sin(this.pulseTime * 2 + i * 0.25) * 8 + Math.random() * 4;
            } else if (isProcessing) {
                amp = 3 + Math.sin(this.pulseTime * 5 + i * 0.5) * 5;
            }

            const x = i * step;
            const y = cy + (i % 2 === 0 ? amp : -amp);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
