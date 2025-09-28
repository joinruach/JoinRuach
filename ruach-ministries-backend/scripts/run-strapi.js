#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

const strapiPkgPath = require.resolve('@strapi/strapi/package.json');
const { bin } = require(strapiPkgPath);
const strapiBinRel = typeof bin === 'string' ? bin : bin?.strapi;

if (!strapiBinRel) {
  console.error('Unable to locate Strapi CLI entry in @strapi/strapi package.json');
  process.exit(1);
}

const strapiBin = path.resolve(path.dirname(strapiPkgPath), strapiBinRel);
const args = process.argv.slice(2);

const child = spawn(process.execPath, [strapiBin, ...args], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
