# Mobile verification

Run the Vite dev server (`npm run dev -- --host 127.0.0.1`) and a separate Chrome profile with remote debugging on localhost port 9222, opened at http://127.0.0.1:5173/. These checks use Chrome's DevTools protocol and Node 22's built-in WebSocket; no test dependencies are required. Run the scripts sequentially because they control the same test tab.

- `node checks/mobile-framing.mjs`: measures projected character geometry and control bounds at 390×844, 320×568, 430×932, 844×390, 768×1024, and 1440×900. Asserts phone framing within 15–25% at spawn, 44px minimum action targets, and no horizontal overflow. Also exercises room-center and wall/corner positions. Saves a portrait screenshot beside the project.
- `node checks/mobile-interactions.mjs`: real touch-pointer joystick and orbit gestures, simultaneous two-thumb control, camera-relative movement, photo tap versus drag, modal input lock, narrow and short landscape modal fit, long-caption scrolling, settings, music, and reduced-motion preference. Standard UI buttons are exercised with browser mouse click events.
- `node checks/moments-and-desktop.mjs`: photo-pose hold and return across orientation changes, kiss sequence and return, desktop WASD and camera settings, wall and pedestal collisions, corner camera bounds, and small photo previews on initial load.

Development-only scene access through React Three Fiber's root store is used to measure geometry and stage boundary cases; production code has no test globals. Runtime exceptions fail the interaction and cinematic checks.

Observed in Chrome emulation: at 390×844 the player occupies approximately 21% of screen height at spawn and 25% in the room center, with feet visible. Phone pixel ratio is capped at 1.25 and the shadow map at 512px. Portrait and landscape controls stay separate. TypeScript, ESLint, and the Vite production build pass.

These are browser emulation checks, not measurements of frame rate or thermal behavior on a physical Android phone. Test those on representative devices before making a device-performance claim. No anniversary-letter component exists in this project; the existing photo-and-memory viewer was made scrollable and safe-area aware.


## Four-room navigation

The route is School Days → College Days → University Life → Outro, with reversible physical passages. Each room is 20 × 14 units; room centers are at X = 0, 22, 44, and 66. Passages are 2 units long and 4.2 units wide. Existing content stays in School Days. The other rooms contain only their structural shell and navigation labels.

`src/lib/museumLayout.ts` supplies both the rendered wall geometry and character/camera collision boundaries. Room progress updates only when a character enters the next room. The companion aligns with passage openings, shadows follow the player, and cinematic staging uses the current room's center.

Additional checks:

- `node checks/room-layout.mjs`: all three passages in both directions, solid wall sections, passage sides, outer limits, camera clearance, and a grid of doorway/corner collision samples.
- `node checks/room-navigation.mjs`: actual WASD and touch-joystick movement through every passage in both directions, both characters reaching each destination, room-label updates, camera-wall clearance during travel, and photo-pose/kiss restoration inside Outro.

Both checks passed in Chrome desktop and 390×844 phone emulation. Existing mobile interaction checks were rerun for photo taps, dragging, modal scrolling, music, settings, and reduced motion.
