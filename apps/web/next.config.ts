import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Workspace packages ship raw TypeScript — `@manasik/types` and
   * `@manasik/validations` point `main` at `src/index.ts`, not a built `dist`.
   * Next must therefore compile them itself.
   *
   * Without this, TYPE-ONLY imports still work (they are erased before the
   * bundler ever sees them), so `pnpm typecheck` passes and the failure only
   * appears the moment something imports a runtime value — `loginSchema` from
   * @manasik/validations in the sign-in action, for one.
   *
   * All four are listed rather than only the ones that need it today, since the
   * same trap is waiting in each.
   */
  transpilePackages: [
    "@manasik/types",
    "@manasik/utils",
    "@manasik/validations",
    "@manasik/config",
  ],
};

export default nextConfig;
