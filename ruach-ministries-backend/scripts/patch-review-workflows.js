#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const COMPONENT_REGEX =
  /permissions: \[],\s*async Component \(\) {\s*const { (\w+) } = await import\('([^']+)'\);\s*return {\s*default: \1\s*};\s*}/gm;

function patchReviewWorkflows() {
  const pnpmDir = path.join(__dirname, "..", "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmDir)) {
    console.warn("pnpm directory is missing; cannot locate review workflows plugin.");
    return;
  }

  const pluginDirName = fs
    .readdirSync(pnpmDir)
    .find((name) => name.startsWith("@strapi+review-workflows@"));

  if (!pluginDirName) {
    console.warn("Review workflows package is missing in the pnpm store; skipping patch.");
    return;
  }

  const pluginDir = path.join(pnpmDir, pluginDirName, "node_modules", "@strapi", "review-workflows");
  const chunksDir = path.join(pluginDir, "dist", "admin", "chunks");

  if (!fs.existsSync(chunksDir)) {
    console.warn("Review workflows admin chunks missing; skipping patch.");
    return;
  }

  const chunks = fs
    .readdirSync(chunksDir)
    .filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));

  if (!chunks.length) {
    console.warn("No admin chunk files found for review workflows; skipping patch.");
    return;
  }

  let patchedFiles = 0;

  for (const chunk of chunks) {
    const filePath = path.join(chunksDir, chunk);
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const patchedContent = content.replace(COMPONENT_REGEX, (_, componentName, importPath) => {
      patchedFiles += 1;
      return `permissions: [],\n                Component: () => import('${importPath}').then(({ ${componentName} }) => ({ default: ${componentName} }))`;
    });

    if (patchedContent !== content) {
      fs.writeFileSync(filePath, patchedContent);
      console.log(`Patched review-workflows chunk: ${filePath}`);
    }
  }

  if (patchedFiles === 0) {
    console.log("Review workflows admin chunks already use the Strapi 5 pattern.");
  }
}

patchReviewWorkflows();
