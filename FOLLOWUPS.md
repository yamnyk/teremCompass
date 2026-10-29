# Follow-ups (deliberately not fixed in the behavior-preserving refactor)

- `openSheet` warn.hidden condition (orig index.html line 387) is convoluted: `steps !== undefined && title !== default` (steps always defined due to the default param).
- AudioContext creation is duplicated in `ding()` and the audio-unlock line of `start()` (`unlockAudio()` in `src/celebrate/sound.ts`).
- Original `geoFixSteps` referenced `isIOS`/`ua` declared later in the script (worked only because it is called at click time); resolved structurally by modules.
- `window.orientation` is deprecated (used in `onOrient` as a fallback).
- ESLint skipped: typescript-eslint does not support TS 7 yet. Revisit.
- `DeviceOrientationEvent.requestPermission` cannot be added to the lib.dom constructor by declaration merging (anonymous type); a cast to `DeviceOrientationEventConstructorWithPermission` is used in `src/sensors/compass.ts`.
- `fail()` lives in `src/ui/readout.ts` (not `sensors/location.ts`) to avoid a compass<->location import cycle.
- `hintText` receives `off`/`a`; `a` is rounded inside it (same as original `Math.round(a)`).
- `tsconfig.json` include lists a `tests` dir that does not exist yet.
- Service worker `catch(() => caches.match(...))` can resolve `undefined` (original behavior); typed with a cast.
- Module script runs deferred (after parse) whereas the original classic script ran inline at end of body: negligible timing difference.
- `tsconfig.sw.json` inherits `exclude: ["src/sw.ts"]` from tsconfig.json, so `tsc -p tsconfig.sw.json` fails with TS18003; it needs `"exclude": []`. (Verified sw.ts typechecks cleanly with that override via a temporary config, since removed.) **Resolved:** `"exclude": []` added; SW typecheck now runs in `pnpm typecheck`/`pnpm build`.

## Phase 2a (tooling and tests)

- ESLint is dropped for now (user decision): `lint` script removed, no eslint config. Revisit once typescript-eslint supports TypeScript 7.
- `tsconfig.json` `include` now resolves: `tests/` exists (geo, hint, i18n-steps tests). The "tests dir does not exist" entry above is resolved.
- `pnpm build` emits `WARN inlineDynamicImports option is deprecated, please use codeSplitting: false instead.` (from the Vite/PWA build chain, not src). Not fixed.
- `src/lib/platform.ts` (`isIOS`, `isStandalone`, `ua`) touches `navigator`/`matchMedia` at import time, so it is untested and cannot be imported by tests without jsdom. `isIOS` is therefore only exercised through the i18n tests, which take the platform as a parameter.
- `src/lib/geo.ts` `norm` returns the lower bound for 540 (`norm(540) === -180`), which is in `[-180, 180)`; the test pins this behavior.
- Prettier reformatted `index.html`, `vercel.json`, all `src/styles/*.css`, `src/i18n/uk.ts`, `src/lib/geo.ts`, `src/lib/platform.ts`, `src/ui/icons.ts` (formatting only, no logic changes). `index.html` `<head>` tags are unchanged in content.
- Vitest 5 is installed with vite 8.3.5 as a peer; `pnpm install` reported no peer warnings. TypeScript 7 is not a vitest peer, so no TS7 conflict was observed.

## Feature ideas

- Desktop direction: desktops have no compass (`deviceorientation` never fires), so there is currently no way to tell which way Teremky is. Come up with a desktop-friendly way to show the direction (approach TBD).
- Route button: a button that builds a route to Teremky (in a maps app). It is hidden until Teremky is "found" and appears only after that. TBD: does "found" mean the first lock (aimed at Teremky, the celebration moment) or simply once the location/bearing is known? Also TBD: which maps provider/app it opens, and whether the button stays visible after unlocking.

## Behaviors pinned by unit tests (candidates for the fix phase)

- `listenCompass` adds orientation listeners on every `start()` call and never removes them.
- A negative `webkitCompassHeading` falls through to the Android (`absolute` + `alpha`) branch.
- `start()` calls `listenCompass` even when geolocation is unavailable.
- The 3 s compass-silence timer is never cancelled; the `?demo` `setInterval` is never cleared.
- Geolocation errors other than codes 1/3 don't touch the `fix`/`go` buttons.
- Distance: 0.9996 km renders "1000м" (no switch to km); km values are rounded to integers (1.5 → 2).
- `setRotation(-0.001)` writes `rotate(-0.00)`.
- `openSheet` is reachable from the install button only when `state.deferred` is empty; its `steps === undefined` branch is unreachable.
- iPad detection requires `maxTouchPoints > 1`; `isStandalone` uses strict `navigator.standalone === true`.
- `$()` is typed non-null but returns `null` for a missing id.
- happy-dom 21 reverses node order for multi-node `insertAdjacentHTML('afterbegin')`, so `renderApp` order is asserted by membership only (real order is covered by the Playwright DOM-diff).
