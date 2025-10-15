declare module "node:path" {
  export function join(...segments: string[]): string;
  export function resolve(...segments: string[]): string;
  export function dirname(path: string): string;
  export const sep: string;
}
