declare module "node:fs/promises" {
  export function readFile(
    path: string,
    options?: { encoding?: string | null; flag?: string }
  ): Promise<string | Buffer>;
}
