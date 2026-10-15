/**
 * ============================================================================
 * J.A.R.V.I.S. SYSTEM BRIDGE, MONGODB HISTORY & MULTI-DEVICE SERVER
 * Host System Automation, Active Window Desktop Control, Mobile QR Uplink & MongoDB
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, spawn } = require('child_process');

let MongoClient = null;
try {
    MongoClient = require('mongodb').MongoClient;
} catch (e) {
    console.warn('MongoDB client module not installed, using fallback file storage.');
}

const PORT = process.env.PORT || 9000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

// Global tunnel state
let activeTunnelProcess = null;
let activeTunnelUrl = null;

// MongoDB Connection State
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jarvis_hud';
let mongoClientInstance = null;
let mongoDb = null;
let isMongoConnected = false;

async function initMongoDB() {
    if (!MongoClient) return;
    try {
        mongoClientInstance = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        await mongoClientInstance.connect();
        mongoDb = mongoClientInstance.db();
        isMongoConnected = true;
        console.log(`  > MongoDB Connected: ${MONGODB_URI}`);
    } catch (err) {
        isMongoConnected = false;
        console.log(`  > MongoDB Not Connected: Using local JSON persistence (${HISTORY_FILE})`);
    }
}
initMongoDB();

// MIME Types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.env': 'text/plain; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
};

/**
 * Detect local IPv4 addresses (Wi-Fi / Ethernet)
 */
function getLocalNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    let primaryIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    name,
                    ip: iface.address,
                    mac: iface.mac
                });
                if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') || name.toLowerCase().includes('eth')) {
                    primaryIp = iface.address;
                } else if (primaryIp === '127.0.0.1') {
                    primaryIp = iface.address;
                }
            }
        }
    }
    return { primaryIp, addresses };
}

/**
 * Real OS CPU load calculation
 */
function getCpuLoad(callback) {
    const cpusBefore = os.cpus();
    setTimeout(() => {
        const cpusAfter = os.cpus();
        let idleDiff = 0;
        let totalDiff = 0;

        for (let i = 0; i < cpusBefore.length; i++) {
            const b = cpusBefore[i].times;
            const a = cpusAfter[i].times;

            const bTotal = b.user + b.nice + b.sys + b.idle + b.irq;
            const aTotal = a.user + a.nice + a.sys + a.idle + a.irq;

            idleDiff += (a.idle - b.idle);
            totalDiff += (aTotal - bTotal);
        }

        const load = totalDiff > 0 ? ((1 - (idleDiff / totalDiff)) * 100) : 5.0;
        callback(parseFloat(Math.max(1, Math.min(100, load)).toFixed(1)));
    }, 200);
}

/**
 * Execute PowerShell command safely
 */
function runPowerShell(script) {
    return new Promise((resolve) => {
        const encoded = Buffer.from(script, 'utf16le').toString('base64');
        const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded]);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('close', (code) => {
            resolve({
                success: code === 0,
                code,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            });
        });

        setTimeout(() => {
            try { child.kill(); } catch (e) {}
            resolve({ success: false, code: -1, stdout: stdout.trim(), stderr: 'Command timed out (15s limit)' });
        }, 15000);
    });
}

/**
 * Launch an interactive GUI application or open a URL in the user's active desktop session
 */
function launchAppOrUrl(target) {
    return new Promise((resolve) => {
        try {
            const child = spawn('cmd.exe', ['/c', 'start', '', target], {
                detached: true,
                stdio: 'ignore',
                windowsHide: false
            });
            child.unref();
            resolve({ success: true, command: target, output: 'Launched interactive window.' });
        } catch (err) {
            runPowerShell(`Start-Process "${target}"`).then(resolve);
        }
    });
}

/**
 * MongoDB & File History Helpers
 */
async function getHistoryMessages(limit = 100) {
    if (isMongoConnected && mongoDb) {
        try {
            const col = mongoDb.collection('messages');
            const docs = await col.find({}).sort({ timestampNum: 1 }).limit(limit).toArray();
            return docs.map(d => ({
                id: d.id,
                role: d.role,
                sender: d.sender,
                badge: d.badge,
                text: d.text,
                timestamp: d.timestamp,
                isError: Boolean(d.isError)
            }));
        } catch (e) {
            console.warn('Mongo read error, falling back to local file:', e.message);
        }
    }

    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const content = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(content || '[]');
        }
    } catch (e) {}
    return [];
}

async function saveHistoryMessage(msg) {
    const doc = {
        id: msg.id || (Date.now() + Math.random()),
        role: msg.role || 'user',
        sender: msg.sender || (msg.role === 'user' ? 'TONY STARK' : 'J.A.R.V.I.S.'),
        badge: msg.badge || (msg.role === 'user' ? 'COMMAND' : 'ONLINE'),
        text: msg.text || '',
        timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestampNum: Date.now(),
        isError: Boolean(msg.isError)
    };

    if (isMongoConnected && mongoDb) {
        try {
            await mongoDb.collection('messages').insertOne(doc);
        } catch (e) {
            console.warn('Mongo insert error:', e.message);
        }
    }

    // Mirror to disk
    try {
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8') || '[]');
        }
        history.push(doc);
        if (history.length > 500) history = history.slice(-500);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    } catch (e) {}

    return doc;
}

async function clearHistoryMessages() {
    if (isMongoConnected && mongoDb) {
        try {
            await mongoDb.collection('messages').deleteMany({});
        } catch (e) {}
    }
    try {
        fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
    } catch (e) {}
}

/**
 * Handle API Requests
 */
async function handleApiRequest(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const readBody = () => new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (e) { resolve({}); }
        });
    });

    // 1. GET /api/network-info
    if (pathname === '/api/network-info' && req.method === 'GET') {
        const { primaryIp, addresses } = getLocalNetworkAddresses();
        const mobileUrl = `http://${primaryIp}:${PORT}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(mobileUrl)}`;

        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            port: PORT,
            primaryIp,
            mobileUrl,
            allInterfaces: addresses,
            qrCodeUrl: qrUrl,
            remoteTunnelUrl: activeTunnelUrl,
            isTunnelActive: Boolean(activeTunnelUrl),
            isMongoConnected
        }));
        return;
    }

    // 2. GET /api/system/stats
    if (pathname === '/api/system/stats' && req.method === 'GET') {
        getCpuLoad((cpuPercent) => {
            const totalMemBytes = os.totalmem();
            const freeMemBytes = os.freemem();
            const usedMemBytes = totalMemBytes - freeMemBytes;
            const ramUsagePercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));

            const totalGB = (totalMemBytes / (1024 ** 3)).toFixed(1);
            const usedGB = (usedMemBytes / (1024 ** 3)).toFixed(1);
            const freeGB = (freeMemBytes / (1024 ** 3)).toFixed(1);

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                cpuLoad: cpuPercent,
                ramPercent: ramUsagePercent,
                ramDetails: {
                    total: `${totalGB} GB`,
                    used: `${usedGB} GB`,
                    free: `${freeGB} GB`
                },
                hostname: os.hostname(),
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                uptimeSeconds: Math.floor(os.uptime())
            }));
        });
        return;
    }

    // 3. POST /api/system/open-app (with writing/text support)
    if (pathname === '/api/system/open-app' && req.method === 'POST') {
        const data = await readBody();
        const app = (data.app || '').toLowerCase().trim();

        if (!app) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No application name specified' }));
            return;
        }

        // Dictation note writing to Notepad
        if ((app === 'notepad' || app === 'notes') && data.text) {
            const noteFile = path.join(DATA_DIR, 'jarvis_note.txt');
            const stamp = new Date().toLocaleString();
            const noteContent = `=== J.A.R.V.I.S. DICTATED NOTE [${stamp}] ===\r\n\r\n${data.text}\r\n`;
            fs.writeFileSync(noteFile, noteContent, 'utf8');

            const result = await launchAppOrUrl(`notepad.exe "${noteFile}"`);
            res.writeHead(200);
            res.end(JSON.stringify({
                success: result.success,
                app: 'notepad',
                text: data.text,
                file: noteFile,
                message: `Notepad opened with note: "${data.text}"`
            }));
            return;
        }

        const appMap = {
            'notepad': 'notepad.exe',
            'notes': 'notepad.exe',
            'calc': 'calc.exe',
            'calculator': 'calc.exe',
            'spotify': 'spotify.exe',
            'chrome': 'chrome.exe',
            'google chrome': 'chrome.exe',
            'browser': 'start chrome.exe',
            'code': 'code',
            'vscode': 'code',
            'vs code': 'code',
            'explorer': 'explorer.exe',
            'files': 'explorer.exe',
            'file explorer': 'explorer.exe',
            'task manager': 'taskmgr.exe',
            'taskmgr': 'taskmgr.exe',
            'cmd': 'cmd.exe',
            'powershell': 'powershell.exe',
            'terminal': 'wt.exe',
            'settings': 'start ms-settings:',
            'paint': 'mspaint.exe',
            'whatsapp': 'https://web.whatsapp.com',
            'whatsapp web': 'https://web.whatsapp.com',
            'web whatsapp': 'https://web.whatsapp.com',
            'youtube': 'https://youtube.com',
            'github': 'https://github.com',
            'google': 'https://google.com',
            'gmail': 'https://mail.google.com'
        };

        const target = appMap[app] || app;
        const result = await launchAppOrUrl(target);

        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            app,
            command: target,
            output: result.output || result.stderr || 'Application launch signal transmitted.'
        }));
        return;
    }

    // 4. POST /api/system/open-url
    if (pathname === '/api/system/open-url' && req.method === 'POST') {
        const data = await readBody();
        let targetUrl = (data.url || '').trim();

        if (!targetUrl) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No URL specified' }));
            return;
        }

        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        const result = await launchAppOrUrl(targetUrl);

        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            url: targetUrl,
            message: `Opened ${targetUrl} in primary host browser.`
        }));
        return;
    }

    // 5. POST /api/system/search (Google, YouTube, Wikipedia, GitHub, Bing)
    if (pathname === '/api/system/search' && req.method === 'POST') {
        const data = await readBody();
        const query = (data.query || '').trim();
        const engine = (data.engine || 'google').toLowerCase();

        if (!query) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No query specified' }));
            return;
        }

        let targetUrl;
        if (engine === 'youtube') {
            targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        } else if (engine === 'wikipedia') {
            targetUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
        } else if (engine === 'github') {
            targetUrl = `https://github.com/search?q=${encodeURIComponent(query)}`;
        } else if (engine === 'amazon') {
            targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
        } else if (engine === 'bing') {
            targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        } else {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }

        const result = await launchAppOrUrl(targetUrl);
        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            engine,
            query,
            url: targetUrl,
            message: `Searched ${engine.toUpperCase()} for "${query}"`
        }));
        return;
    }

    // 6. POST /api/system/type (Type into active window)
    if (pathname === '/api/system/type' && req.method === 'POST') {
        const data = await readBody();
        const text = (data.text || '').replace(/'/g, "''");
        if (!text) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No text provided' }));
            return;
        }
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.SendKeys]::SendWait('${text}')
        `;
        const result = await runPowerShell(script);
        res.writeHead(200);
        res.end(JSON.stringify({ success: result.success, message: 'Typed text into active window' }));
        return;
    }

    // 7. POST /api/system/volume
    if (pathname === '/api/system/volume' && req.method === 'POST') {
        const data = await readBody();
        const action = (data.action || 'up').toLowerCase();

        let sendKey = 175;
        let repeat = 5;

        if (action === 'down' || action === 'lower') {
            sendKey = 174;
        } else if (action === 'mute') {
            sendKey = 173;
            repeat = 1;
        } else if (action === 'unmute') {
            sendKey = 173;
            repeat = 1;
        } else if (action === 'max') {
            sendKey = 175;
            repeat = 25;
        }

        const script = `
            $obj = New-Object -ComObject WScript.Shell
            for ($i = 0; $i -lt ${repeat}; $i++) {
                $obj.SendKeys([char]${sendKey})
                Start-Sleep -Milliseconds 40
            }
        `;
        const result = await runPowerShell(script);

        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            action,
            message: `Acoustic volume recalibrated: ${action.toUpperCase()}`
        }));
        return;
    }

    // 8. POST /api/system/lock
    if (pathname === '/api/system/lock' && req.method === 'POST') {
        const script = `rundll32.exe user32.dll,LockWorkStation`;
        const result = await runPowerShell(script);

        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            message: 'Host console locked. Security protocol engaged.'
        }));
        return;
    }

    // 9. GET /api/system/screenshot
    if (pathname === '/api/system/screenshot' && req.method === 'GET') {
        const script = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
            $ms = New-Object System.IO.MemoryStream
            $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $base64 = [Convert]::ToBase64String($ms.ToArray())
            $graphics.Dispose()
            $bitmap.Dispose()
            $ms.Dispose()
            Write-Output $base64
        `;
        const result = await runPowerShell(script);

        if (result.success && result.stdout) {
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                image: `data:image/png;base64,${result.stdout}`,
                timestamp: new Date().toISOString()
            }));
        } else {
            res.writeHead(500);
            res.end(JSON.stringify({
                success: false,
                error: result.stderr || 'Failed to capture screen buffer'
            }));
        }
        return;
    }

    // 10. POST /api/system/execute
    if (pathname === '/api/system/execute' && req.method === 'POST') {
        const data = await readBody();
        const command = (data.command || '').trim();

        if (!command) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No command specified' }));
            return;
        }

        const result = await runPowerShell(command);
        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            command,
            exitCode: result.code,
            stdout: result.stdout,
            stderr: result.stderr
        }));
        return;
    }

    // 11. MONGODB CONVERSATION HISTORY API
    // GET /api/history
    if (pathname === '/api/history' && req.method === 'GET') {
        const messages = await getHistoryMessages();
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            messages,
            isMongoConnected
        }));
        return;
    }

    // POST /api/history
    if (pathname === '/api/history' && req.method === 'POST') {
        const data = await readBody();
        const saved = await saveHistoryMessage(data);
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            message: saved,
            isMongoConnected
        }));
        return;
    }

    // DELETE /api/history
    if (pathname === '/api/history' && req.method === 'DELETE') {
        await clearHistoryMessages();
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            message: 'Conversation history purged from database.',
            isMongoConnected
        }));
        return;
    }

    // GET /api/history/export
    if (pathname === '/api/history/export' && req.method === 'GET') {
        const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const format = parsed.searchParams.get('format') || 'markdown';
        const messages = await getHistoryMessages(1000);

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="jarvis_conversation_history.json"');
            res.writeHead(200);
            res.end(JSON.stringify(messages, null, 2));
            return;
        }

        let md = `# J.A.R.V.I.S. TACTICAL CONVERSATION ARCHIVE\n\n`;
        md += `**Generated**: ${new Date().toLocaleString()}\n`;
        md += `**Total Records**: ${messages.length}\n`;
        md += `**Storage Matrix**: ${isMongoConnected ? 'MongoDB (Local Instance)' : 'Resilient File Cache'}\n\n`;
        md += `---\n\n`;

        messages.forEach(m => {
            md += `### [${m.timestamp}] ${m.sender} (${m.badge})\n`;
            md += `${m.text}\n\n`;
        });

        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="jarvis_transcript.md"');
        res.writeHead(200);
        res.end(md);
        return;
    }

    // 12. POST /api/tunnel/toggle
    if (pathname === '/api/tunnel/toggle' && req.method === 'POST') {
        if (activeTunnelProcess) {
            try { activeTunnelProcess.kill(); } catch (e) {}
            activeTunnelProcess = null;
            activeTunnelUrl = null;
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                active: false,
                message: 'Remote tunnel disconnected. Reverted to local network.'
            }));
            return;
        }

        try {
            const tunnelChild = spawn('npx.cmd', ['-y', 'localtunnel', '--port', String(PORT)]);
            activeTunnelProcess = tunnelChild;

            let capturedUrl = null;

            const onData = (chunk) => {
                const text = chunk.toString();
                const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/);
                if (match) {
                    capturedUrl = match[0];
                    activeTunnelUrl = capturedUrl;
                }
            };

            tunnelChild.stdout.on('data', onData);
            tunnelChild.stderr.on('data', onData);

            tunnelChild.on('close', () => {
                activeTunnelProcess = null;
                activeTunnelUrl = null;
            });

            let waited = 0;
            while (!capturedUrl && waited < 30) {
                await new Promise(r => setTimeout(r, 200));
                waited++;
            }

            if (capturedUrl) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    active: true,
                    tunnelUrl: capturedUrl,
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(capturedUrl)}`,
                    message: 'Remote secure cellular tunnel operational!'
                }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: false,
                    active: false,
                    message: 'Tunnel initiation started in background. Please retry in a few seconds.'
                }));
            }
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
}

/**
 * Static File Server Handler
 */
function handleStaticFile(req, res, pathname) {
    let safePath = path.normalize(decodeURIComponent(pathname));
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const filePath = path.join(ROOT_DIR, safePath);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${pathname}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
}

/**
 * Initialize Server
 */
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/')) {
        handleApiRequest(req, res, pathname);
    } else {
        handleStaticFile(req, res, pathname);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    const { primaryIp } = getLocalNetworkAddresses();
    console.log(`================================================================`);
    console.log(`  J.A.R.V.I.S. SYSTEM BRIDGE & MULTI-DEVICE SERVER ONLINE`);
    console.log(`================================================================`);
    console.log(`  > Local Computer Console: http://localhost:${PORT}`);
    console.log(`  > Mobile Phone (Wi-Fi):  http://${primaryIp}:${PORT}`);
    console.log(`  > MongoDB History:       ${isMongoConnected ? 'ONLINE' : 'FALLBACK FILE'}`);
    console.log(`  > System Capabilities:   App Launch, Audio, Screen, Exec, Shell, Search`);
    console.log(`================================================================`);
});
