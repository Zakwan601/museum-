# Mobile verification

Run the Vite dev server (`npm run dev -- --host 127.0.0.1`) and a separate Chrome profile with remote debugging on localhost port 9222, opened at http://127.0.0.1:5173/. These checks use Chrome's DevTools protocol and Node 22's built-in WebSocket; no test dependencies are required. Run the scripts sequentially because they control the same test tab.

- `node checks/mobile-framing.mjs`: measures projected character geometry and control bounds at 390×844, 320×568, 430×932, 844×390, 768×1024, and 1440×900. Asserts phone framing within 15–25% at spawn, 44px minimum action targets, and no horizontal overflow. Also exercises room-center and wall/corner positions. Saves a portrait screenshot beside the project.
- `node checks/mobile-interactions.mjs`: real touch-pointer joystick and orbit gestures, simultaneous two-thumb control, camera-relative movement, photo tap versus drag, modal input lock, narrow and short landscape modal fit, long-caption scrolling, settings, music, and reduced-motion preference. Standard UI buttons are exercised with browser mouse click events.
- `node checks/moments-and-desktop.mjs`: photo-pose hold and return across orientation changes, kiss sequence and return, desktop WASD and camera settings, wall and pedestal collisions, corner camera bounds, and small photo previews on initial load.

Development-only scene access through React Three Fiber's root store is used to measure geometry and stage boundary cases; production code has no test globals. Runtime exceptions fail the interaction and cinematic checks.

Observed in Chrome emulation: at 390×844 the player occupies approximately 21% of screen height at spawn and 25% in the room center, with feet visible. Phone pixel ratio is capped at 1.25 and the shadow map at 512px. Portrait and landscape controls stay separate. TypeScript, ESLint, and the Vite production build pass.

These are browser emulation checks, not measurements of frame rate or thermal behavior on a physical Android phone. Test those on representative devices before making a device-performance claim. No anniversary-letter component exists in this project; the existing photo-and-memory viewer was made scrollable and safe-area aware.


## Four-room navigation

The route is School Days → College Days → University Life → Future, with reversible magical-arch transitions. Each room is 20 × 14 units; room centers are at X = 0, 22, 44, and 66. Passages are 2 units long and 4.2 units wide. School Days keeps its original content. College Days is an indoor Midnight Gallery with dusty blue paneling, dark wooden floors, a navy bench, and a constellation ceiling. University Life is an ivory and champagne Golden Gallery with lighter wood, cream seating, warm lighting, larger photo displays, and a portrait beside the exit. Future remains a placeholder. All six passage entrances use arched openings with matching trim and labels above the arch.

`src/lib/museumLayout.ts` supplies both the rendered wall geometry and character/camera collision boundaries. Room progress updates only when a character enters the next room. The companion aligns with passage openings, shadows follow the player, and cinematic staging uses the current room's center.

Additional checks:

- `node checks/room-layout.mjs`: all three passages in both directions, solid wall sections, passage sides, outer limits, camera clearance, and a grid of doorway/corner collision samples.
- `node checks/room-navigation.mjs`: both characters approaching each arch, explicit Continue actions, every connection in both directions, room-label updates, hidden relocation, preserved progress and restored controls on desktop and mobile.

Both checks passed in Chrome desktop and 390×844 phone emulation. Existing mobile interaction checks were rerun for photo taps, dragging, modal scrolling, music, settings, and reduced motion.

## Mobile immersive mode

`node checks/immersive-mode.mjs` checks unsupported and denied fullscreen, a resolved request without actual fullscreen, unsupported/denied landscape lock, exit denial, system exit, an exit during a pending orientation request, responsive landscape controls, and absence of the immersive UI on desktop. Those error paths use mocked browser API responses. The same check also exercises Chrome's actual native Fullscreen API for entry and exit without mocks.

Fullscreen ownership is derived from `document.fullscreenElement`; no CSS-only state pretends to be fullscreen. A landscape lock is attempted only after confirmed fullscreen. The museum continues to use its real viewport for layout, and orientation locks acquired by the museum are released on exit. Browser/OS support still determines whether browser chrome can hide or orientation can lock. No new dependencies are used.


## Indoor galleries and arches

`node checks/gallery-interiors.mjs` verifies all six arches, renders gallery previews, opens the photo viewer from proximity prompts in both new galleries on desktop and phone layouts, checks bench collisions, and catches runtime errors. `room-navigation.mjs` now enters through the intro before exercising every passage in both directions with WASD and the mobile joystick. `room-layout.mjs` includes the benches and floral displays in collision samples.

The added photo displays reuse the existing sample images and captions; replace their configuration with personal photos when available. Decorations and wooden floorboards are instanced, local lighting is enabled only in the occupied gallery, and added frame spotlights activate only for the nearby photograph. No new dependencies or external assets were added.


Mobile entry now attempts fullscreen and landscape lock directly from the **Enter Our Little World** tap, before the intro fade. The museum root remains mounted through the transition so fullscreen is retained. Desktop entry does not request fullscreen. Unsupported or denied requests still open the museum and offer a truthful fallback with optional retry.

`node checks/automatic-immersive.mjs` checks native Chrome fullscreen from that entry tap, confirms user activation and a persistent fullscreen root, checks the landscape-lock request (mocked), exit behavior, denied/unsupported fallbacks, unchanged desktop entry, and the renamed **Future** room in both the menu and location indicator.


## School Days bookshelf

The bookshelf occupies an unused section of the front wall at (-3.2, 0, 6.38), away from the doorway and central walking route. Its collision volume is shared with the museum layout; its geometry also participates in camera collision checks. The shelf uses six verified Himu edition covers by Humayun Ahmed, with Bengali titles and author names. Cover provenance is recorded in `public/books/SOURCES.md`.

Small local WebP covers load near the shelf. Larger cover references load only in the viewer. Books reuse the existing proximity prompt, camera gesture protection, input-locking modal and focus trap; the viewer uses Bengali typography and shows the selected cover, title, author and dedication. No dependencies were added.

`node checks/bookshelf.mjs` checks the six cover textures, deferred full-cover loading, proximity prompt, all title/cover matches, viewer movement lock, phone sizing, real 3D cover clicks, shelf collision and the existing photo viewer. It also tests real phone touch tap versus drag, camera isolation and scrolling on a short landscape screen. `room-layout.mjs` includes the new shelf in wall/furniture collision samples.


## Vintage photo cards

Wall photos use thin cream paper mounts, a shared 256px procedural paper texture, slight individual tilts, and a larger bottom margin. Photo images fill the print window with aspect-preserving cropping. The enlarged viewer shows the complete image on textured cream paper with the title, date and caption below it. Photos have no metallic frame, corner hardware, rounded panel outline or header divider. Book covers and the simplified book viewer are unchanged.

`node checks/vintage-photos.mjs` checks the borderless viewer and caption layout and saves wall/viewer previews. `mobile-interactions.mjs` now enters through the intro before checking joystick movement, independent camera orbit, photo tap versus drag, modal input lock, short/narrow viewport fit, scrolling, music and settings.


## Future bouquet welcome

The first time both characters clear the Future entrance, the existing cinematic controller starts a 10.4-second bouquet scene. The boy presents a custom-geometry rose bouquet, the girl reaches for the same bouquet and accepts it, and the camera gently moves closer before returning to exploration. Shared world-space grip points align the hands with the stem despite the characters' different heights. The girl keeps the bouquet while walking afterward; existing kiss and photo moments temporarily use their original poses and restore the keepsake when complete.

The welcome runs once per museum session, without a new action button. It waits if a menu, viewer or another cinematic is active. Movement and camera input are locked during the sequence and restored afterward. Reduced motion disables the cinematic orbit. Flowers, stems and leaves use instanced custom geometry; no external models, textures or dependencies were added.

`node checks/future-bouquet.mjs` checks automatic entry, waiting for the companion, actual hand-to-stem alignment during presentation and acceptance, desktop/phone camera layouts and orientation changes, completion, restored movement, carrying while walking, once-only reentry, and preserved photo/kiss actions. It saves presentation and acceptance screenshots for both device layouts. `room-navigation.mjs` allows the welcome to complete while testing all doorways with WASD and the touch joystick.


## Magical room transitions

The six arch faces glow softly with the next gallery's palette. Both characters must approach together before the Continue/Return prompt appears. Walking alone does not cross the threshold. The 2.6-second transition fades the room out while a small burst of instanced point sprites drifts from the arch, moves both characters while the view is fully opaque, then reveals the next gallery and restores input. The camera's orbit heading is retained and its position is updated under the fade. Arrival placement keeps the couple together and clear of walls and furniture.

The same Canvas, scene objects, music player, controls, interaction state and bouquet keepsake survive every transition. Re-entering Future does not replay its welcome. Battery saver and reduced motion use a simple fade without particles; reduced motion also disables the subtle camera push. Particles use 14 points per active arch on mobile and 24 on desktop, without post-processing or simulation libraries. Fade timing uses elapsed real time so slow rendering does not stretch the transition.

`node checks/magical-transitions.mjs` (also available as `node checks/room-navigation.mjs`) checks both-character proximity, explicit choice, opaque relocation, 2.6-second timing, particles, every connection in both directions, desktop/phone controls, music and collected bouquet preservation, and both simple-fade fallbacks.
