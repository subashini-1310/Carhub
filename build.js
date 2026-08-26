const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('[CarHub Vercel Build] Installing frontend dependencies...');
  execSync('npm --prefix frontend install', { stdio: 'inherit' });

  console.log('[CarHub Vercel Build] Building frontend with Vite...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });

  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  const rootDist = path.join(__dirname, 'dist');

  if (fs.existsSync(frontendDist)) {
    if (!fs.existsSync(rootDist)) {
      fs.mkdirSync(rootDist, { recursive: true });
    }
    fs.cpSync(frontendDist, rootDist, { recursive: true });
    console.log('[CarHub Vercel Build] Successfully copied frontend/dist to ./dist');
  } else {
    console.error('[CarHub Vercel Build Error] frontend/dist directory not found.');
    process.exit(1);
  }
} catch (err) {
  console.error('[CarHub Vercel Build Failed]:', err.message);
  process.exit(1);
}
