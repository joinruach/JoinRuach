/**
 * Safe path validation for shell command arguments.
 *
 * Prevents path traversal and write-outside-sandbox attacks.
 * Every file path passed to execFile() should go through this first.
 */

import * as path from 'path';
import * as os from 'os';

const ALLOWED_ROOTS = [
  os.tmpdir(),
  path.join(os.tmpdir(), 'ruach-renders'),
  path.join(os.tmpdir(), 'transcode-'),
];

/**
 * Validate that a resolved path starts with one of the allowed root directories.
 * Throws if the path escapes the sandbox.
 *
 * @param filePath - The path to validate
 * @param context - Description for error messages (e.g., 'render output')
 * @returns The resolved, validated absolute path
 */
export function validatePath(filePath: string, context: string): string {
  const resolved = path.resolve(filePath);

  const isAllowed = ALLOWED_ROOTS.some(
    (root) => resolved.startsWith(root + path.sep) || resolved === root
  );

  if (!isAllowed) {
    throw new Error(
      `[safe-path] Path escapes sandbox (${context}): ${resolved}. ` +
      `Allowed roots: ${ALLOWED_ROOTS.join(', ')}`
    );
  }

  return resolved;
}

/**
 * Validate a filename contains no path separators.
 * Use this when accepting a "name" that should not navigate directories.
 *
 * @param fileName - The filename to validate
 * @param context - Description for error messages
 * @returns The validated filename
 */
export function validateFileName(fileName: string, context: string): string {
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    throw new Error(
      `[safe-path] Invalid filename (${context}): "${fileName}". ` +
      `Filenames must not contain path separators or '..'.`
    );
  }

  if (fileName.length === 0 || fileName.length > 255) {
    throw new Error(
      `[safe-path] Filename length out of range (${context}): ${fileName.length} chars.`
    );
  }

  return fileName;
}
