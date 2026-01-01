const fs = require('fs');

const src = 'C:/Users/user/.gemini/antigravity/brain/ddf3a917-a3d7-482b-b7b8-0a3605663a82/uploaded_image_1766581758933.png';
const dest = 'd:/Proyek Coding/aplikasi-sabamas/backend/uploads/logo/sabamas-logo.png';

console.log('Checking source:', src);
console.log('Source exists:', fs.existsSync(src));

try {
    fs.copyFileSync(src, dest);
    console.log('File copied successfully to ' + dest);
} catch (error) {
    console.error('Error copying file:', error);
}
