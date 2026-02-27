/**
 * Regression tests for safe-path validation.
 *
 * These tripwire tests ensure path traversal attacks are permanently blocked.
 * If any test here fails, a security invariant has been violated.
 */

import * as os from 'os';
import * as path from 'path';
import { validatePath, validateFileName } from '../../src/services/safe-path';

describe('validatePath', () => {
  const tmpDir = os.tmpdir();

  describe('accepts valid sandbox paths', () => {
    it('accepts file inside os.tmpdir()', () => {
      const p = path.join(tmpDir, 'somefile.mp4');
      expect(validatePath(p, 'test')).toBe(p);
    });

    it('accepts file inside ruach-renders/', () => {
      const p = path.join(tmpDir, 'ruach-renders', 'job-123.mp4');
      expect(validatePath(p, 'test')).toBe(p);
    });

    it('accepts file inside transcode- prefixed dir', () => {
      const p = path.join(tmpDir, 'transcode-abc123', 'output.mp4');
      expect(validatePath(p, 'test')).toBe(p);
    });
  });

  describe('rejects path traversal attacks', () => {
    it('rejects ../ traversal', () => {
      expect(() =>
        validatePath(path.join(tmpDir, '..', 'etc', 'passwd'), 'test')
      ).toThrow('[safe-path]');
    });

    it('rejects absolute path outside sandbox', () => {
      expect(() => validatePath('/etc/passwd', 'test')).toThrow('[safe-path]');
    });

    it('rejects /root escape', () => {
      expect(() => validatePath('/root/.ssh/id_rsa', 'test')).toThrow(
        '[safe-path]'
      );
    });

    it('rejects home directory escape', () => {
      expect(() =>
        validatePath(path.join(os.homedir(), '.env'), 'test')
      ).toThrow('[safe-path]');
    });

    it('rejects double-dot in the middle of path', () => {
      expect(() =>
        validatePath(
          path.join(tmpDir, 'ruach-renders', '..', '..', 'etc', 'shadow'),
          'test'
        )
      ).toThrow('[safe-path]');
    });

    it('rejects Windows-style paths on any OS', () => {
      expect(() => validatePath('C:\\Windows\\System32\\cmd.exe', 'test')).toThrow(
        '[safe-path]'
      );
    });
  });

  it('resolves relative paths before validation', () => {
    // A relative path like "./foo" resolves to cwd, which is NOT in the sandbox
    expect(() => validatePath('./foo.mp4', 'test')).toThrow('[safe-path]');
  });

  it('includes context in error message', () => {
    expect(() => validatePath('/etc/passwd', 'render output')).toThrow(
      'render output'
    );
  });
});

describe('validateFileName', () => {
  describe('accepts valid filenames', () => {
    it('accepts simple filename', () => {
      expect(validateFileName('video.mp4', 'test')).toBe('video.mp4');
    });

    it('accepts filename with dashes and numbers', () => {
      expect(validateFileName('render-123-abc.mp4', 'test')).toBe(
        'render-123-abc.mp4'
      );
    });

    it('accepts filename with dots', () => {
      expect(validateFileName('file.backup.mp4', 'test')).toBe(
        'file.backup.mp4'
      );
    });
  });

  describe('rejects path separators', () => {
    it('rejects forward slash', () => {
      expect(() => validateFileName('path/file.mp4', 'test')).toThrow(
        '[safe-path]'
      );
    });

    it('rejects backslash', () => {
      expect(() => validateFileName('path\\file.mp4', 'test')).toThrow(
        '[safe-path]'
      );
    });

    it('rejects double-dot', () => {
      expect(() => validateFileName('..', 'test')).toThrow('[safe-path]');
    });

    it('rejects double-dot prefix', () => {
      expect(() => validateFileName('../etc/passwd', 'test')).toThrow(
        '[safe-path]'
      );
    });

    it('rejects embedded double-dot', () => {
      expect(() => validateFileName('foo..bar', 'test')).toThrow(
        '[safe-path]'
      );
    });
  });

  describe('rejects extreme lengths', () => {
    it('rejects empty filename', () => {
      expect(() => validateFileName('', 'test')).toThrow('[safe-path]');
    });

    it('rejects filename over 255 chars', () => {
      const longName = 'a'.repeat(256) + '.mp4';
      expect(() => validateFileName(longName, 'test')).toThrow('[safe-path]');
    });

    it('accepts filename at 255 char limit', () => {
      const maxName = 'a'.repeat(251) + '.mp4'; // 255 total
      expect(validateFileName(maxName, 'test')).toBe(maxName);
    });
  });

  it('includes context in error message', () => {
    expect(() => validateFileName('../evil', 'R2 download')).toThrow(
      'R2 download'
    );
  });
});
