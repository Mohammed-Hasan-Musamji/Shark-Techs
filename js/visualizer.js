/**
 * ============================================================================
 * J.A.R.V.I.S. HOLOGRAPHIC ARC REACTOR & AUDIO WAVEFORM VISUALIZER
 * Multi-Ring Canvas Graphics, Energy Particles & Real-time State Reactions
 * ============================================================================
 */

class ArcReactorVisualizer {
    constructor() {
        this.reactorCanvas = document.getElementById('reactorCanvas');
        this.reactorCtx = this.reactorCanvas.getContext('2d');

        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.waveformCtx = this.waveformCanvas.getContext('2d');

        // State: 'standby' | 'listening' | 'processing' | 'speaking'
        this.state = 'standby';

        // Animation timing & rotation angles
        this.rotInner = 0;
        this.rotMid = 0;
        this.rotOuter = 0;
        this.pulseTime = 0;

        // Visual energy particles
        this.particles = [];
        this.maxParticles = 36;
        this.initParticles();

        // Audio frequency simulation buffer
        this.audioData = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            this.audioData[i] = 10;
        }

        // Active Theme Colors
        this.updateThemeColors();

        // Start render loop
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
                    modeTag.style.color = '#ff3366';
                    modeDesc.textContent = 'Awaiting your voice input... Speak now.';
                    break;
                case 'processing':
                    modeTag.textContent = 'PROCESSING';
                    modeTag.style.color = 'var(--primary-glow)';
                    modeDesc.textContent = 'Analyzing neural intent & telemetry...';
                    break;
                case 'speaking':
                    modeTag.textContent = 'VOCAL FEED';
                    modeTag.style.color = 'var(--primary-glow)';
                    modeDesc.textContent = 'Transmitting J.A.R.V.I.S. vocal response...';
                    break;
                case 'standby':
                default:
                    modeTag.textContent = 'STANDBY';
                    modeTag.style.color = 'var(--primary-glow)';
                    modeDesc.textContent = 'Awaiting your instruction, Sir.';
                    break;
            }
        }
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                dist: 45 + Math.random() * 95,
                speed: 0.005 + Math.random() * 0.015,
                size: 1 + Math.random() * 2.5,
                alpha: 0.2 + Math.random() * 0.7,
                radShift: (Math.random() - 0.5) * 0.5
            });
        }
    }

    animate() {
        this.drawReactor();
        this.drawWaveform();
        requestAnimationFrame(this.animate);
    }

    /**
     * Draw the Multi-Ring Arc Reactor
     */
    drawReactor() {
        const ctx = this.reactorCtx;
        const w = this.reactorCanvas.width;
        const h = this.reactorCanvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Compute rotation speeds and pulse based on active state
        let speedMult = 1.0;
        let pulseIntensity = 0.5 + 0.5 * Math.sin(this.pulseTime * 2);

        if (this.state === 'listening') {
            speedMult = 2.4;
            pulseIntensity = 0.7 + 0.3 * Math.sin(this.pulseTime * 6);
        } else if (this.state === 'processing') {
            speedMult = 3.8;
            pulseIntensity = 0.5 + 0.5 * Math.sin(this.pulseTime * 10);
        } else if (this.state === 'speaking') {
            speedMult = 1.6;
            pulseIntensity = 0.6 + 0.4 * Math.sin(this.pulseTime * 4);
        }

        this.rotInner += 0.012 * speedMult;
        this.rotMid -= 0.008 * speedMult;
        this.rotOuter += 0.004 * speedMult;
        this.pulseTime += 0.025;

        // --- 1. Outer Ring & Telemetry Notches ---
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotOuter);

        ctx.strokeStyle = this.primaryDim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 160, 0, Math.PI * 2);
        ctx.stroke();

        // Outer ticks
        const outerTicks = 36;
        for (let i = 0; i < outerTicks; i++) {
            const angle = (i * Math.PI * 2) / outerTicks;
            const r1 = 158;
            const r2 = (i % 3 === 0) ? 170 : 164;
            ctx.strokeStyle = (i % 3 === 0) ? this.primaryGlow : this.primaryDim;
            ctx.lineWidth = (i % 3 === 0) ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
            ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
            ctx.stroke();
        }

        // Segmented HUD arcs
        ctx.strokeStyle = this.primaryGlow;
        ctx.lineWidth = 3;
        ctx.shadowColor = this.primaryGlow;
        ctx.shadowBlur = 8;
        for (let i = 0; i < 4; i++) {
            const startArc = (i * Math.PI / 2) + 0.2;
            const endArc = startArc + 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 150, startArc, endArc);
            ctx.stroke();
        }
        ctx.restore();

        // --- 2. Middle Ring with Mechanical Chevrons & Capacitors ---
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotMid);

        ctx.strokeStyle = this.primaryAccent;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 118, 0, Math.PI * 2);
        ctx.stroke();

        // 10 Classic Arc Reactor Coils / Segment Blocks
        const numCoils = 10;
        for (let i = 0; i < numCoils; i++) {
            const angle = (i * Math.PI * 2) / numCoils;
            ctx.save();
            ctx.rotate(angle);

            // Coil bounding box
            const coilDist = 105;
            ctx.fillStyle = (this.state === 'listening') ? 'rgba(255, 51, 102, 0.4)' : this.primaryDim;
            ctx.strokeStyle = (this.state === 'listening') ? '#ff3366' : this.primaryGlow;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = (this.state === 'listening') ? '#ff3366' : this.primaryGlow;

            ctx.fillRect(coilDist - 6, -8, 14, 16);
            ctx.strokeRect(coilDist - 6, -8, 14, 16);

            // Inner copper windings simulation
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(coilDist - 3, -5);
            ctx.lineTo(coilDist + 5, -5);
            ctx.moveTo(coilDist - 3, 0);
            ctx.lineTo(coilDist + 5, 0);
            ctx.moveTo(coilDist - 3, 5);
            ctx.lineTo(coilDist + 5, 5);
            ctx.stroke();

            ctx.restore();
        }
        ctx.restore();

        // --- 3. Inner Rotating Ring with Angle Markers ---
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotInner);

        ctx.strokeStyle = this.primaryGlow;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 72, 0, Math.PI * 2);
        ctx.stroke();

        // Inner triangular markers
        const numArrows = 6;
        for (let i = 0; i < numArrows; i++) {
            const angle = (i * Math.PI * 2) / numArrows;
            ctx.save();
            ctx.rotate(angle);
            ctx.fillStyle = this.primaryGlow;
            ctx.beginPath();
            ctx.moveTo(68, 0);
            ctx.lineTo(60, -4);
            ctx.lineTo(60, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // --- 4. Central Glowing Arc Reactor Core ---
        ctx.save();
        ctx.translate(cx, cy);

        // Core halo
        const coreRadius = 40 + (pulseIntensity * 8);
        const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, coreRadius);
        
        let coreCenterColor = '#ffffff';
        let coreEdgeColor = this.primaryGlow;
        if (this.state === 'listening') {
            coreCenterColor = '#ffeaef';
            coreEdgeColor = '#ff3366';
        }

        grad.addColorStop(0, coreCenterColor);
        grad.addColorStop(0.35, coreEdgeColor);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.shadowColor = coreEdgeColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pure white inner pinpoint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 14 + (pulseIntensity * 3), 0, Math.PI * 2);
        ctx.fill();

        // Concentric core ring
        ctx.strokeStyle = coreEdgeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // --- 5. Orbiting Quantum Particles ---
        ctx.save();
        ctx.translate(cx, cy);
        for (let p of this.particles) {
            p.angle += p.speed * speedMult;
            p.dist += p.radShift;
            if (p.dist > 165 || p.dist < 40) {
                p.radShift = -p.radShift;
            }

            const px = Math.cos(p.angle) * p.dist;
            const py = Math.sin(p.angle) * p.dist;

            ctx.fillStyle = (this.state === 'listening') 
                ? `rgba(255, 51, 102, ${p.alpha})` 
                : (this.primaryGlow.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba') || `rgba(0, 240, 255, ${p.alpha})`);

            ctx.shadowColor = (this.state === 'listening') ? '#ff3366' : this.primaryGlow;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Draw the Live Audio Oscilloscope Waveform
     */
    drawWaveform() {
        const ctx = this.waveformCtx;
        const w = this.waveformCanvas.width;
        const h = this.waveformCanvas.height;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        ctx.lineWidth = 2;
        ctx.strokeStyle = (this.state === 'listening') ? '#ff3366' : this.primaryGlow;
        ctx.shadowColor = (this.state === 'listening') ? '#ff3366' : this.primaryGlow;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        const segments = 48;
        const step = w / segments;

        for (let i = 0; i <= segments; i++) {
            const x = i * step;
            let amp = 2; // idle baseline

            if (this.state === 'listening') {
                amp = 8 * Math.sin(i * 0.4 + this.pulseTime * 12) + (Math.random() * 4 - 2);
            } else if (this.state === 'speaking') {
                amp = 14 * Math.sin(i * 0.5 + this.pulseTime * 8) * Math.cos(i * 0.2);
            } else if (this.state === 'processing') {
                amp = 5 * Math.sin(i * 0.8 + this.pulseTime * 14);
            } else {
                amp = 2 * Math.sin(i * 0.2 + this.pulseTime * 2);
            }

            const y = cy + amp;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

// Global Visualizer Instance
window.jarvisVisualizer = null;
