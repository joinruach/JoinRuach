declare module "buffer" {
  export class Buffer extends Uint8Array {
    static from(
      value: string | ArrayBuffer | ArrayLike<number>,
      encoding?: string
    ): Buffer;
    static alloc(size: number, fill?: string | Uint8Array, encoding?: string): Buffer;
    toString(encoding?: string): string;
  }

  export type BufferEncoding =
    | "ascii"
    | "utf8"
    | "utf-8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "base64url"
    | "latin1"
    | "binary"
    | "hex";
}
