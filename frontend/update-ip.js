const fs = require('fs');
const os = require('os');
const path = require('path');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (127.0.0.1) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const ip = getLocalIp();
const envPath = path.join(__dirname, '.env.local');
const apiUrl = `NEXT_PUBLIC_API_URL=http://${ip}:3001/api`;

console.log(`\n🔄 Auto-detecting IP Address...`);
console.log(`📡 Local IP: ${ip}`);

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
        // Replace existing NEXT_PUBLIC_API_URL or append if not exists
        const regex = /^NEXT_PUBLIC_API_URL=.*$/m;
        if (regex.test(content)) {
            content = content.replace(regex, apiUrl);
        } else {
            content += `\n${apiUrl}`;
        }
    } else {
        content = apiUrl;
    }

    fs.writeFileSync(envPath, content.trim() + '\n');
    console.log(`✅ Updated .env.local: ${apiUrl}\n`);
} catch (error) {
    console.error('❌ Failed to update .env.local:', error);
}
