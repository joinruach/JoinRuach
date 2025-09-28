const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

const PACKAGES = Array.from(
  new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ])
);

const nodeModulesDir = path.resolve(__dirname, '..', 'node_modules');
const pnpmDir = path.join(nodeModulesDir, '.pnpm');

function getPackageRoot(pkgName) {
  const prefix = pkgName.replace('/', '+') + '@';
  let entry;

  try {
    entry = fs
      .readdirSync(pnpmDir)
      .find((folder) => folder.startsWith(prefix));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  if (!entry) {
    return null;
  }

  return path.join(pnpmDir, entry, 'node_modules', ...pkgName.split('/'));
}

function ensureSymlink(pkgName) {
  const packageRoot = getPackageRoot(pkgName);
  if (!packageRoot || !fs.existsSync(packageRoot)) {
    console.warn(`[link-dependencies] Skipping ${pkgName}; package directory not found.`);
    return;
  }

  const linkPath = path.join(nodeModulesDir, ...pkgName.split('/'));
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });

  try {
    const existingTarget = fs.readlinkSync(linkPath);
    if (existingTarget === packageRoot) {
      return;
    }
    fs.unlinkSync(linkPath);
  } catch (error) {
    if (error.code === 'EINVAL') {
      fs.rmSync(linkPath, { recursive: true, force: true });
    } else if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  fs.symlinkSync(packageRoot, linkPath, 'junction');
}

for (const pkg of PACKAGES) {
  ensureSymlink(pkg);
}
