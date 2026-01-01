import * as fs from 'fs';
import * as path from 'path';

const src = String.raw`C:\Users\user\.gemini\antigravity\brain\ddf3a917-a3d7-482b-b7b8-0a3605663a82\uploaded_image_1766581758933.png`;
const dest = String.raw`d:\Proyek Coding\aplikasi-sabamas\backend\uploads\logo\sabamas-logo.png`;

console.log('Start copying...');
try {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('SUCCESS: File copied to', dest);
    } else {
        console.error('ERROR: Source file not found at', src);
    }
} catch (e) {
    console.error('ERROR:', e);
}
