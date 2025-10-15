// Minimal Node.js ambient declarations required for local type-checking when
// the real @types/node package is unavailable in this environment.

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }

  interface Process {
    env: ProcessEnv;
    argv: string[];
    nextTick(callback: (...args: unknown[]) => void): void;
    cwd(): string;
  }
}

declare const process: NodeJS.Process;

type NodeBuffer = import("buffer").Buffer;

declare const Buffer: {
  new (str: string, encoding?: import("buffer").BufferEncoding): NodeBuffer;
  from(
    value: string | ArrayBuffer | ArrayLike<number>,
    encoding?: import("buffer").BufferEncoding
  ): NodeBuffer;
  alloc(
    size: number,
    fill?: string | Uint8Array,
    encoding?: import("buffer").BufferEncoding
  ): NodeBuffer;
  isBuffer(value: unknown): value is NodeBuffer;
};

type Buffer = NodeBuffer;

declare function require(id: string): unknown;
