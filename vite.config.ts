import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Vercel exposes the deployed commit; locally fall back to git, then to a fixed marker.
function gitShort(): string | undefined {
  try {
    return execSync("git rev-parse --short=7 HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {}
}

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? gitShort() ?? "dev";

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  plugins: [
    {
      // the running app compares its own build id to this file to learn an update is live
      name: "version-json",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ id: buildId }),
        });
      },
    },
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: false,
      devOptions: { enabled: false },
      injectManifest: {
        globPatterns: ["**/*.{html,js,css,png,webmanifest}"],
      },
    }),
  ],
});
