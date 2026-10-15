/**
 * ============================================================================
 * J.A.R.V.I.S. NATIVE DESKTOP APPLICATION (ELECTRON CORE)
 * Native Windows Command Console, Host Automation & Active App Controller
 * ============================================================================
 */

const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = 9000;

/**
 * Check if the host server is already running on port 9000
 */
function isServerRunning() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${SERVER_PORT}/api/network-info`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(800, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Launch background server.js if not already started
 */
async function ensureServerRunning() {
    const running = await isServerRunning();
    if (running) {
        console.log('[ELECTRON] Bridge server already active on port', SERVER_PORT);
        return;
    }

    console.log('[ELECTRON] Starting host system bridge server...');
    serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    // Wait up to 5 seconds for server to start
    let attempts = 0;
    while (attempts < 25) {
        await new Promise(r => setTimeout(r, 200));
        if (await isServerRunning()) {
            console.log('[ELECTRON] Host system bridge server online!');
            return;
        }
        attempts++;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 1024,
        minHeight: 700,
        title: 'J.A.R.V.I.S. Mark VII - Desktop Command Center',
        backgroundColor: '#030712',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });

    // Load server URL
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Register Alt+Space hotkey to toggle window visibility
    globalShortcut.register('Alt+Space', () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.focus();
            }
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(async () => {
    await ensureServerRunning();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (serverProcess) {
        try { serverProcess.kill(); } catch (e) {}
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
