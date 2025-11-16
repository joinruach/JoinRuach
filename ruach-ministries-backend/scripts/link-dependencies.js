const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

(function main() {
  const packageDirs = loadWorkspacePackageDirs();
  const workspacePackages = packageDirs ? collectWorkspacePackageNames(packageDirs) : new Map();

  if (workspacePackages.size === 0) {
    console.warn('[link-dependencies] No workspace packages detected. Skipping custom linking.');
    return;
  }

  const packagesToLink = Array.from(
    new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
    ])
  ).filter((pkgName) => workspacePackages.has(pkgName));

  if (packagesToLink.length === 0) {
    console.log('[link-dependencies] No workspace dependencies to link.');
    return;
  }

  const nodeModulesDir = path.resolve(__dirname, '..', 'node_modules');

  for (const pkg of packagesToLink) {
    ensureSymlink(nodeModulesDir, pkg, workspacePackages.get(pkg));
  }
})();

function ensureSymlink(nodeModulesDir, pkgName, packageRoot) {
  if (!packageRoot || !fs.existsSync(packageRoot)) {
    console.warn(`[link-dependencies] Skipping ${pkgName}; workspace package directory not found.`);
    return;
  }

  const linkPath = path.join(nodeModulesDir, ...pkgName.split('/'));
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });

  try {
    const existingTarget = fs.readlinkSync(linkPath);
    if (path.resolve(path.dirname(linkPath), existingTarget) === packageRoot) {
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

function loadWorkspacePackageDirs() {
  const workspaceFile = findWorkspaceFile(path.resolve(__dirname, '..'));
  if (!workspaceFile) {
    console.warn('[link-dependencies] pnpm-workspace.yaml not found. Skipping workspace linking.');
    return null;
  }

  const patterns = parseWorkspacePatterns(workspaceFile);
  if (patterns.length === 0) {
    return [];
  }

  const workspaceRoot = path.dirname(workspaceFile);
  const dirs = new Set();
  for (const pattern of patterns) {
    expandPattern(workspaceRoot, pattern).forEach((dir) => dirs.add(dir));
  }
  return Array.from(dirs);
}

function collectWorkspacePackageNames(packageDirs) {
  const packages = new Map();

  for (const dir of packageDirs) {
    const manifestPath = path.join(dir, 'package.json');
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest?.name) {
        packages.set(manifest.name, dir);
      }
    } catch (error) {
      console.warn(`[link-dependencies] Failed to parse ${manifestPath}: ${error.message}`);
    }
  }

  return packages;
}

function findWorkspaceFile(startDir) {
  let current = startDir;
  const root = path.parse(startDir).root;

  while (current && current !== root) {
    const candidate = path.join(current, 'pnpm-workspace.yaml');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    current = path.dirname(current);
  }

  const candidate = path.join(root, 'pnpm-workspace.yaml');
  return fs.existsSync(candidate) ? candidate : null;
}

function parseWorkspacePatterns(workspaceFile) {
  const contents = fs.readFileSync(workspaceFile, 'utf8');
  const lines = contents.split(/\r?\n/);
  const patterns = [];
  let inPackages = false;
  let baseIndent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inPackages) {
      const match = line.match(/^(\s*)packages\s*:/);
      if (match) {
        inPackages = true;
        baseIndent = match[1].length;
      }
      continue;
    }

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const currentIndent = line.search(/\S|$/);
    if (currentIndent <= baseIndent && !trimmed.startsWith('-')) {
      break;
    }

    if (trimmed.startsWith('-')) {
      const value = trimmed.replace(/^-+\s*/, '');
      if (value && !value.startsWith('!')) {
        patterns.push(value);
      }
    }
  }

  return patterns;
}

function expandPattern(rootDir, pattern) {
  const normalized = pattern
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');

  if (!normalized) {
    return [];
  }

  const segments = normalized.split('/').filter(Boolean);
  const results = new Set();

  const walk = (currentDir, index) => {
    if (index >= segments.length) {
      const manifestPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(manifestPath)) {
        results.add(path.resolve(currentDir));
      }
      return;
    }

    const segment = segments[index];
    if (segment === '**') {
      walk(currentDir, index + 1);
      for (const nextDir of readChildDirs(currentDir)) {
        walk(nextDir, index);
      }
      return;
    }

    const matcher = createMatcher(segment);
    for (const nextDir of readChildDirs(currentDir)) {
      if (matcher(path.basename(nextDir))) {
        walk(nextDir, index + 1);
      }
    }
  };

  walk(rootDir, 0);
  return Array.from(results);
}

function readChildDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !shouldSkipDir(entry.name))
      .map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}

function shouldSkipDir(name) {
  return name === 'node_modules' || name === '.git' || name === '.turbo';
}

function createMatcher(segment) {
  if (!segment.includes('*')) {
    return (value) => value === segment;
  }

  const pattern = `^${segment
    .split('*')
    .map(escapeRegex)
    .join('.*')}$`;
  const regex = new RegExp(pattern);
  return (value) => regex.test(value);
}

function escapeRegex(value) {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}
