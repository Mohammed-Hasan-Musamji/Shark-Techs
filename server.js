/**
 * ============================================================================
 * J.A.R.V.I.S. ZERO-DEPENDENCY SYSTEM BRIDGE & HOST SERVER
 * Node.js Host Agent, System Automation, Computer Controls, MongoDB & Mobile QR
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');

// Load environment variables from .env
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
    const envLines = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
                process.env[key] = val;
            }
        }
    }
}

const PORT = parseInt(process.env.PORT || '9000', 10);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = process.env.MONGODB_DB || 'jarvis_hud';

let isMongoConnected = false;
let mongoDb = null;
let mongoClient = null;

// Connect to MongoDB with graceful fallback
(async function initMongo() {
    try {
        const { MongoClient } = require('mongodb');
        mongoClient = new MongoClient(MONGO_URI, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000
        });
        await mongoClient.connect();
        mongoDb = mongoClient.db(MONGO_DB_NAME);
        isMongoConnected = true;
        console.log(`  > MongoDB Connected: ${MONGO_URI}/${MONGO_DB_NAME}`);
    } catch (e) {
        isMongoConnected = false;
        console.log(`  > MongoDB Notice: Using local resilient file cache (${e.message})`);
    }
})();

let activeTunnelProcess = null;
let activeTunnelUrl = null;

/**
 * MIME Types for static file serving
 */
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
};

/**
 * Discover network interfaces (IPv4)
 */
function getLocalNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ interface: name, ip: iface.address });
            }
        }
    }

    const wifiOrEth = addresses.find(a =>
        a.interface.toLowerCase().includes('wi-fi') ||
        a.interface.toLowerCase().includes('wifi') ||
        a.interface.toLowerCase().includes('eth') ||
        a.interface.toLowerCase().includes('local')
    );

    return {
        primaryIp: (wifiOrEth || addresses[0] || { ip: '127.0.0.1' }).ip,
        addresses
    };
}

/**
 * Measure CPU Load over brief sampling window
 */
function getCpuLoad(callback) {
    const cpus1 = os.cpus();
    setTimeout(() => {
        const cpus2 = os.cpus();
        let totalDiff = 0;
        let idleDiff = 0;

        for (let i = 0; i < cpus1.length; i++) {
            const t1 = cpus1[i].times;
            const t2 = cpus2[i].times;
            const total1 = t1.user + t1.nice + t1.sys + t1.idle + t1.irq;
            const total2 = t2.user + t2.nice + t2.sys + t2.idle + t2.irq;
            totalDiff += (total2 - total1);
            idleDiff += (t2.idle - t1.idle);
        }

        const load = totalDiff > 0 ? ((1 - (idleDiff / totalDiff)) * 100) : 5.0;
        callback(parseFloat(Math.max(1, Math.min(100, load)).toFixed(1)));
    }, 200);
}

/**
 * Execute PowerShell script safely using EncodedCommand (UTF-16LE base64)
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
 * Rock-solid desktop application and URL launcher for Windows
 * Resolves URI protocols, executables with arguments, Store apps, and URLs cleanly
 */
function launchAppOrUrl(target, args = '') {
    return new Promise((resolve) => {
        const cleanTarget = (target || '').trim();
        const isUrl = /^https?:\/\//i.test(cleanTarget);
        const isProtocol = /^[a-z0-9-]+:($|\/\/)/i.test(cleanTarget);

        let psScript;
        if (isUrl || isProtocol) {
            psScript = `Start-Process '${cleanTarget.replace(/'/g, "''")}'`;
        } else if (args) {
            psScript = `Start-Process '${cleanTarget.replace(/'/g, "''")}' -ArgumentList '${args.replace(/'/g, "''")}'`;
        } else {
            psScript = `Start-Process '${cleanTarget.replace(/'/g, "''")}'`;
        }

        runPowerShell(psScript).then((res) => {
            if (res.success) {
                resolve({ success: true, command: cleanTarget, output: 'Interactive process launched in foreground.' });
            } else {
                // Fallback to cmd.exe /c start with properly quoted title and executable
                try {
                    let cmdCommand;
                    if (isUrl || isProtocol) {
                        cmdCommand = `start "" "${cleanTarget}"`;
                    } else if (args) {
                        cmdCommand = `start "" "${cleanTarget}" "${args}"`;
                    } else {
                        cmdCommand = `start "" "${cleanTarget}"`;
                    }

                    const child = spawn('cmd.exe', ['/c', cmdCommand], {
                        detached: true,
                        stdio: 'ignore',
                        windowsHide: false
                    });
                    child.unref();
                    resolve({ success: true, command: cleanTarget, output: 'Launched via secondary shell subsystem.' });
                } catch (cmdErr) {
                    resolve({ success: false, error: res.stderr || cmdErr.message });
                }
            }
        });
    });
}

/**
 * MongoDB & Resilient Local File History Storage
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

    // 3. POST /api/system/open-app (Direct application launcher & dictation writing)
    if (pathname === '/api/system/open-app' && req.method === 'POST') {
        const data = await readBody();
        const app = (data.app || '').toLowerCase().trim();

        if (!app) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No application name specified' }));
            return;
        }

        // Notepad dictation text writing
        if ((app === 'notepad' || app === 'notes') && data.text) {
            const noteFile = path.join(DATA_DIR, 'jarvis_note.txt');
            const stamp = new Date().toLocaleString();
            const noteContent = `=== J.A.R.V.I.S. DICTATED NOTE [${stamp}] ===\r\n\r\n${data.text}\r\n`;
            fs.writeFileSync(noteFile, noteContent, 'utf8');

            const result = await launchAppOrUrl('notepad.exe', noteFile);
            res.writeHead(200);
            res.end(JSON.stringify({
                success: result.success,
                app: 'notepad',
                text: data.text,
                file: noteFile,
                message: `Notepad launched with note: "${data.text}"`
            }));
            return;
        }

        // Mapping shortcuts to Windows applications, UWP Store protocol URIs and URLs
        const appMap = {
            'notepad': 'notepad.exe',
            'notes': 'notepad.exe',
            'calc': 'calc.exe',
            'calculator': 'calc.exe',
            'spotify': data.query ? `spotify:search:${encodeURIComponent(data.query)}` : 'spotify:',
            'chrome': 'chrome.exe',
            'google chrome': 'chrome.exe',
            'browser': 'https://google.com',
            'code': 'vscode:',
            'vscode': 'vscode:',
            'vs code': 'vscode:',
            'visual studio code': 'vscode:',
            'explorer': 'explorer.exe',
            'files': 'explorer.exe',
            'file explorer': 'explorer.exe',
            'task manager': 'taskmgr.exe',
            'taskmgr': 'taskmgr.exe',
            'cmd': 'cmd.exe',
            'powershell': 'powershell.exe',
            'terminal': 'wt.exe',
            'settings': 'ms-settings:',
            'paint': 'mspaint.exe',
            'whatsapp': 'whatsapp:',
            'whatsapp web': 'https://web.whatsapp.com',
            'web whatsapp': 'https://web.whatsapp.com',
            'youtube': 'https://youtube.com',
            'github': 'https://github.com',
            'google': 'https://google.com',
            'gmail': 'https://mail.google.com'
        };

        const target = appMap[app] || app;
        let result = await launchAppOrUrl(target);

        // Fallbacks for Store apps if native protocol is not installed
        if (!result.success) {
            if (app === 'whatsapp') {
                result = await launchAppOrUrl('https://web.whatsapp.com');
            } else if (app === 'spotify') {
                result = await launchAppOrUrl('https://open.spotify.com');
            } else if (app === 'code' || app === 'vscode' || app === 'vs code') {
                result = await launchAppOrUrl('code.cmd');
            } else if (app === 'terminal') {
                result = await launchAppOrUrl('powershell.exe');
            }
        }

        res.writeHead(200);
        res.end(JSON.stringify({
            success: result.success,
            app,
            command: target,
            output: result.output || result.error || 'Application launch signal transmitted.'
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

    // 5. POST /api/system/search (Google, YouTube, Wikipedia, GitHub, Bing, Amazon)
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

    // 11. POST /api/system/file-action (List, Read, Write local files)
    if (pathname === '/api/system/file-action' && req.method === 'POST') {
        const data = await readBody();
        const action = data.action;
        const targetPath = data.path || ROOT_DIR;

        try {
            if (action === 'list') {
                const files = fs.readdirSync(targetPath);
                const items = files.map(name => {
                    const full = path.join(targetPath, name);
                    try {
                        const stat = fs.statSync(full);
                        return { name, isDirectory: stat.isDirectory(), size: stat.size };
                    } catch (e) {
                        return { name, isDirectory: false, size: 0 };
                    }
                });
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, path: targetPath, items }));
                return;
            } else if (action === 'read') {
                const content = fs.readFileSync(targetPath, 'utf8');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, path: targetPath, content }));
                return;
            } else if (action === 'write') {
                fs.writeFileSync(targetPath, data.content || '', 'utf8');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, path: targetPath, message: 'File written successfully' }));
                return;
            }
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
        }
    }

    // 12. MONGODB CONVERSATION HISTORY API
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

    // POST /api/history (Saves user prompt & assistant response to MongoDB)
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

    // 13. POST /api/tunnel/toggle
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

            setTimeout(() => {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: Boolean(activeTunnelUrl),
                    active: Boolean(activeTunnelUrl),
                    tunnelUrl: activeTunnelUrl,
                    message: activeTunnelUrl
                        ? `Satellite tunnel online at: ${activeTunnelUrl}`
                        : 'Tunnel initializing in background. Please refresh in 3 seconds.'
                }));
            }, 3500);
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
        return;
    }

    // Default 404 for unknown API routes
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
}

/**
 * Handle Static File Requests
 */
function handleStaticFile(req, res, pathname) {
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
}

/**
 * Server Lifecycle Initialization
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
