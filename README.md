
# Ruach Monorepo

A single Next.js + component library setup composed from three sources:
- `apps/ruach-next` (app)
- `packages/ruach-components` (UI library)
- `packages/ruach-next-addons` (addons/utilities)

## Quickstart

1. Install pnpm (v9+ recommended).
2. Install deps at the repo root:
   ```bash
   pnpm install
   ```
3. Start dev:
   ```bash
   pnpm dev
   ```
4. Build all:
   ```bash
   pnpm build
   ```

## Notes
- The app is configured to `transpilePackages` for the two local libraries.
- Libraries are built with `tsup` (ESM + CJS + DTS).
- Shared TS options live in `tsconfig.base.json`.
- Workspace linking uses `workspace:*` versions.


## Shared Tailwind + Tokens

- A shared preset lives in `packages/tailwind-preset` and is consumed by the app via:
  ```ts
  // apps/ruach-next/tailwind.config.ts
  import preset from "@ruach/tailwind-preset";
  export default { presets: [preset] };
  ```
- Shadcn-style HSL tokens are defined in `packages/ruach-components/src/styles/tokens.css`.
  The app imports them from `app/globals.css`.

## Vercel Deploy

- Set the Vercel project root to `apps/ruach-next`.
- The app's `vercel.json` builds local packages first, then the Next.js app.
- Environment variables: put them in Vercel Project Settings → Environment Variables.

