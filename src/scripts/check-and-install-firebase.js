const { execSync } = require('child_process');
const path = require('path');

function isInstalled(name) {
  try {
    require.resolve(name, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

const deps = ['firebase-admin', 'firebase-functions'];
const missing = deps.filter(dep => !isInstalled(dep));

if (missing.length > 0) {
  console.log(`📦 Installing missing dependencies: ${missing.join(', ')}`);
  execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
} else {
  console.log('✅ All Firebase dependencies are already installed.');
}