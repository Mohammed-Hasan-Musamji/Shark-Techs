/**
 * ============================================================================
 * J.A.R.V.I.S. MOBILE CONNECT VIEW (V - MVC)
 * Mobile Uplink, QR Code Generator, Device Detector & Remote Tunnel Controls
 * ============================================================================
 */

class MobileConnectView {
    constructor(systemBridgeModel, audioView) {
        this.bridge = systemBridgeModel;
        this.audio = audioView;

        this.modal = document.getElementById('mobileUplinkModal');
        this.screenshotModal = document.getElementById('screenshotModal');

        this.init();
    }

    init() {
        this.detectDeviceType();

        // Subscribe to bridge updates
        this.bridge.subscribe((type, data) => {
            if (type === 'network_info_updated' || type === 'tunnel_updated') {
                this.renderNetworkInfo(this.bridge.networkInfo);
            }
            if (type === 'screenshot_ready') {
                this.showScreenshot(data);
            }
        });

        this.setupEventListeners();
    }

    detectDeviceType() {
        const ua = navigator.userAgent || '';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const deviceBadge = document.getElementById('deviceTypeBadge');
        const phoneHeaderBtn = document.getElementById('btnMobileUplink');

        if (deviceBadge) {
            if (isMobile) {
                deviceBadge.textContent = '📱 MOBILE REMOTE CONTROLLER ACTIVE';
                deviceBadge.className = 'device-badge mobile-mode';
            } else {
                deviceBadge.textContent = '💻 HOST WORKSTATION CONSOLE';
                deviceBadge.className = 'device-badge desktop-mode';
            }
        }

        if (phoneHeaderBtn) {
            phoneHeaderBtn.innerHTML = isMobile ? '<span>📱 PHONE CONTROLLER</span>' : '<span>📱 CONNECT PHONE</span>';
        }
    }

    renderNetworkInfo(info) {
        const urlDisplay = document.getElementById('mobileUrlDisplay');
        const qrImg = document.getElementById('qrCodeImage');
        const tunnelBtn = document.getElementById('btnToggleTunnel');
        const tunnelStatus = document.getElementById('tunnelStatusText');
        const tunnelContainer = document.getElementById('remoteTunnelContainer');

        if (urlDisplay) {
            urlDisplay.textContent = info.isTunnelActive ? info.remoteTunnelUrl : info.mobileUrl;
        }

        if (qrImg && info.qrCodeUrl) {
            qrImg.src = info.qrCodeUrl;
        }

        if (tunnelBtn && tunnelStatus) {
            if (info.isTunnelActive) {
                tunnelBtn.textContent = 'DISCONNECT TUNNEL';
                tunnelBtn.classList.add('active');
                tunnelStatus.textContent = `PUBLIC HTTPS ACTIVE: ${info.remoteTunnelUrl}`;
                tunnelStatus.style.color = 'var(--primary-glow)';
            } else {
                tunnelBtn.textContent = 'ENGAGE REMOTE CELLULAR TUNNEL';
                tunnelBtn.classList.remove('active');
                tunnelStatus.textContent = 'Local Wi-Fi Only (Click to enable access outside home)';
                tunnelStatus.style.color = 'var(--text-muted)';
            }
        }
    }

    setupEventListeners() {
        // Open Mobile Uplink Modal
        const btnUplink = document.getElementById('btnMobileUplink');
        if (btnUplink) {
            btnUplink.addEventListener('click', () => {
                this.openModal();
                this.bridge.fetchNetworkInfo();
                if (this.audio) this.audio.playClick();
            });
        }

        // Close Modal
        const btnClose = document.getElementById('btnCloseMobileUplink');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.closeModal();
                if (this.audio) this.audio.playClick();
            });
        }

        // Copy Link
        const btnCopy = document.getElementById('btnCopyMobileUrl');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const info = this.bridge.networkInfo;
                const url = info.isTunnelActive ? info.remoteTunnelUrl : info.mobileUrl;
                navigator.clipboard.writeText(url).then(() => {
                    btnCopy.textContent = 'COPIED!';
                    setTimeout(() => { btnCopy.textContent = 'COPY LINK'; }, 2000);
                });
                if (this.audio) this.audio.playClick();
            });
        }

        // Toggle Tunnel
        const btnTunnel = document.getElementById('btnToggleTunnel');
        if (btnTunnel) {
            btnTunnel.addEventListener('click', async () => {
                btnTunnel.textContent = 'TRANSMITTING TUNNEL HANDSHAKE...';
                if (this.audio) this.audio.playWakePing();
                await this.bridge.toggleRemoteTunnel();
            });
        }

        // Fast Action Triggers (Quick tap shortcuts on phone)
        document.querySelectorAll('.bridge-quick-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.getAttribute('data-bridge-action');
                if (this.audio) this.audio.playClick();

                if (action === 'spotify') await this.bridge.openApp('spotify');
                else if (action === 'notepad') await this.bridge.openApp('notepad');
                else if (action === 'chrome') await this.bridge.openApp('chrome');
                else if (action === 'calc') await this.bridge.openApp('calc');
                else if (action === 'volume-mute') await this.bridge.controlVolume('mute');
                else if (action === 'volume-up') await this.bridge.controlVolume('up');
                else if (action === 'screenshot') await this.bridge.captureScreenshot();
                else if (action === 'lock') await this.bridge.lockWorkstation();
            });
        });

        // Screenshot Modal Close
        const btnCloseScreen = document.getElementById('btnCloseScreenshot');
        if (btnCloseScreen && this.screenshotModal) {
            btnCloseScreen.addEventListener('click', () => {
                this.screenshotModal.classList.remove('active');
            });
        }
    }

    openModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            this.renderNetworkInfo(this.bridge.networkInfo);
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    }

    showScreenshot(imageDataUrl) {
        if (!this.screenshotModal) return;
        const imgEl = document.getElementById('screenshotImagePreview');
        const downloadBtn = document.getElementById('btnDownloadScreenshot');

        if (imgEl) imgEl.src = imageDataUrl;
        if (downloadBtn) {
            downloadBtn.href = imageDataUrl;
            downloadBtn.download = `jarvis_desktop_capture_${Date.now()}.png`;
        }

        this.screenshotModal.classList.add('active');
        if (this.audio) this.audio.playProcessComplete();
    }
}
