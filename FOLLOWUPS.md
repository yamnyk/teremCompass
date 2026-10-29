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
- `tsconfig.sw.json` inherits `exclude: ["src/sw.ts"]` from tsconfig.json, so `tsc -p tsconfig.sw.json` fails with TS18003; it needs `"exclude": []`. (Verified sw.ts typechecks cleanly with that override via a temporary config, since removed.)
