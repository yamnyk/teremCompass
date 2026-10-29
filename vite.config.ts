import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      devOptions: { enabled: false },
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
      },
    }),
  ],
});
