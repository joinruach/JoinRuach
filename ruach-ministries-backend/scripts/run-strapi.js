#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const strapiPackageDir = path.dirname(require.resolve('@strapi/strapi/package.json'));
const registerPath = require.resolve('esbuild-register/dist/node', { paths: [strapiPackageDir] });
// eslint-disable-next-line import/no-dynamic-require, global-require
const { register } = require(registerPath);

register();

const nodePathEntries = [
  path.join(projectRoot, 'node_modules'),
  path.join(projectRoot, 'node_modules/.pnpm/node_modules'),
  path.join(strapiPackageDir, 'node_modules'),
];

process.env.NODE_PATH = nodePathEntries.join(path.delimiter);
require('module').Module._initPaths();
try {
  // Some legacy controllers expect a default export from @strapi/utils.
  const utils = require('@strapi/utils');
  if (utils && !('default' in utils)) {
    utils.default = utils;
  }
} catch (error) {
  // Allow Strapi bootstrap to surface missing dependency errors later if needed.
}
const args = process.argv.slice(2);

const maybeRunScript = async () => {
  if (args[0] !== 'console') {
    return false;
  }

  const fileFlagIndex = args.indexOf('--file');
  if (fileFlagIndex === -1) {
    return false;
  }

  const scriptArg = args[fileFlagIndex + 1];
  if (!scriptArg) {
    console.error('Missing value after --file.');
    process.exit(1);
  }

  const scriptPath = path.resolve(projectRoot, scriptArg);

  const { createStrapi } = require('@strapi/strapi');

  const app = await createStrapi().load();

  try {
    await app.bootstrap();
    const moduleExports = await import(scriptPath);
    const runner = moduleExports?.default ?? moduleExports;

    if (typeof runner !== 'function') {
      throw new Error(`Script at ${scriptArg} does not export a default function.`);
    }

    await runner({ strapi: app });
  } finally {
    await app.destroy();
  }

  return true;
};

maybeRunScript()
  .then((handled) => {
    if (handled) {
      process.exit(0);
    }

    const strapiPkgPath = require.resolve('@strapi/strapi/package.json');
    const { bin } = require(strapiPkgPath);
    const strapiBinRel = typeof bin === 'string' ? bin : bin?.strapi;

    if (!strapiBinRel) {
      console.error('Unable to locate Strapi CLI entry in @strapi/strapi package.json');
      process.exit(1);
    }

    const strapiBin = path.resolve(path.dirname(strapiPkgPath), strapiBinRel);

    const filteredArgs = args.filter((value, index) => {
      if (value === '--file') {
        return false;
      }

      if (index > 0 && args[index - 1] === '--file') {
        return false;
      }

      return true;
    });

    const child = spawn(process.execPath, [strapiBin, ...filteredArgs], {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
