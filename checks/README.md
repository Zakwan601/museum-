## Complete original anniversary ending (Step 4)

The completed heartHold state (heartProgress exactly 1) glows for 2.4 seconds before Scene hands off once to the existing `pullback` ? `complete` ending controller. CameraRig retains the cinematic viewing side, performs its original pullback, then freezes; Character and Chibi use the original endingFrozen guard. The existing App anniversary section and ending CSS are unchanged, including content, typography, colors, responsive layout, fade and Replay Our Story button. Hash fixtures in `original-ending-hashes.json` protect both source blocks.

The heart stays in world space and softly dims to 28% brightness during the pullback to keep the message readable. Existing collected-memory placements now translate to the couple's actual cake-side center and use the retained viewing angle, avoiding a layout mismatch with their old arrival positions. The temporary heart-stage menu is hidden during the automatic transition; replay and memory access use the original final message controls. MusicPlayer stays mounted, retaining its current playback/softening state. No new ending screen, text, buttons, timeouts, or asynchronous completion callbacks were added. Replay reuses the original object/state resets and Canvas unmount to clear the full sequence and dispose its resources.

`checks/complete-ending.mjs` runs the real sequence on desktop and mobile: collect a memory and play music, navigate all three arches, complete the bouquet/reveal/invitation, walk to the cake with real joystick/WASD, light/wish/blow, safely align, complete the original kiss, form the entire heart, wait for the original ending, verify frozen actor/camera transforms and unchanged message/style hashes, resize through 390?844, 320?568 and 844?390, reopen the original collected photo, use the real replay button, and enter a fresh School Days scene. `checks/cake-ceremony.mjs` forwards to that canonical full-flow check. Physical phone GPU performance remains unmeasured; Step 3's bounded-effect CPU-throttled browser check remains the performance baseline.

## Candle-to-kiss-to-heart (Step 3)

Scene extends the shared cake phase machine with kissPause, aligning, kissing, constellation, and heartHold. After the original extinguishing finishes, a 0.8-second pause precedes alignment. The girl stays in the player-chosen spot; only when needed, the existing NPC velocity/Chibi step inputs guide the boy around the solid pedestal to a nearby kiss position, with cake, girl, and garden-edge clearance. It calls the same App `startMoment('kiss')` used by the original heart button. The existing Scene duration/completion controller starts the constellation only after that real kiss completes. Both feet stay fixed during the kiss, real mouth contact is retained, and the bouquet stays visible. Normal movement remains locked throughout and at the completed heart, with existing replay/memory access in the menu. The anniversary-message section is unchanged and not triggered.

HeartConstellation uses three small Points batches (39 total points, shared 32px radial glow map) and one line-segment batch. A mathematical 32-point heart curve is placed in world space above/behind the pair, with shallow depth variation, seven surrounding stars, staged upward paths, progressive line draw, and restrained twinkles. No lights, post-processing, physics, React frame updates, or timers are added. Reduced motion shortens assembly and removes drift/twinkles. Resources dispose on replay/unmount; the existing replay clears all phases, alignment, progress, poses and locks. The original CameraRig eases to the pair's side and raises/widens its existing view to fit the heart, rather than creating another camera.

`checks/cake-ceremony.mjs` now checks the complete Steps 2?3 flow on touch/mouse: candle order, pause, duplicate guards, NPC/cake clearance, stationary girl, original kiss mouth contact and completion, no early heart, completed line count/framing, persistent bouquet, hidden anniversary message, input locks, reduced motion, bounded effects at 4x browser CPU throttling, and replay. Browser emulation is not a physical-phone GPU benchmark.

## Cake ceremony (Step 2)

The same cake state and Scene frame loop now proceed through positioning, lighting, wish, blowing, and finished. The nearby prompt is guarded synchronously. Character preserves the player-chosen position and bouquet grip, stops both walking velocities, and smoothly turns both characters toward the cake. Three shared-geometry flames light at 0.65-second intervals with one shadow-free local light. After the wish message has been visible for four seconds, the single continuation button appears. Existing Chibi eye scaling provides a brief eye closure; flames and light fade out together, with twelve short-lived points (disabled for reduced motion/battery saver). Normal girl controls, memories, and replay unlock afterward. No kiss, constellation, or anniversary-message transition starts.

`checks/cake-ceremony.mjs` exercises real touch and mouse activation, duplicate guards, sequential lighting, movement locks, actor/pedestal clearance, reading pause, extinction, control restoration, and replay. State changes alone update React UI; frame animation mutates the existing shared state. Replay resets every ceremony field and remounts/disposes its scene resources.

## Cake feature, stage one (current final-room flow)

The existing bouquet and reaction complete first. The spacious floating garden, with roughly four times its earlier ground area, contains a dark, unlit-candle cake/pedestal from arrival. Its local shadow fades as a 2.4-second golden pool and short-range, shadow-free point light reveal it. Only after that reveal does the existing NPC velocity/step animation walk the boy to a fixed cake-side position. He faces the girl and waits. The existing joystick/WASD and drag camera unlock for the girl's approach, with island-edge, cake, and NPC collision checks. The cake is over five world units from arrival, so a player-driven walk is required. A nearby wish button centered on the screen only acknowledges a placeholder; it starts no ceremony, candles, kiss, constellation, or final-message transition.

Collected memories remain in the existing state and photo viewer, accessible through the settings menu. That menu also reuses the existing replay action. Replay resets the cake state alongside bouquet, controls, NPC, memories and room state, without reloading the page. Reduced motion and battery saver keep the essential walk and gradual light reveal, without adding particles or shadows.

`node checks/cake-invitation.mjs` covers desktop and phone portrait/landscape: dark cake before handoff, unchanged bouquet grips, gradual reveal, girl never automatically moved, the NPC walk/stop/invitation, actual joystick/WASD, actual mouse/touch wish activation, original photo captions/music, and replay. `node checks/cake-safety.mjs` covers walking collisions, exterior camera bounds, a capped-DPR/CPU-throttled browser sample, and replaying the scene under battery saver/reduced motion. Browser timings are not physical-phone benchmarks.

The existing anniversary message and finale components are preserved for a later ceremony stage, as requested. `legacy-ending.mjs` is a test-only continuation into that pre-existing finale so the older ending, grip, atmosphere, memory-card, and replay regression checks can still exercise it; production exposes no later-stage trigger.

﻿# Mobile verification

Run the Vite dev server (`npm run dev -- --host 127.0.0.1`) and a separate Chrome profile with remote debugging on localhost port 9222, opened at http://127.0.0.1:5173/. These checks use Chrome's DevTools protocol and Node 22's built-in WebSocket; no test dependencies are required. Run the scripts sequentially because they control the same test tab.

- `node checks/mobile-framing.mjs`: measures projected character geometry and control bounds at 390×844, 320×568, 430×932, 844×390, 768×1024, and 1440×900. Asserts phone framing within 15–25% at spawn, 44px minimum action targets, and no horizontal overflow. Also exercises room-center and wall/corner positions. Saves a portrait screenshot beside the project.
- `node checks/mobile-interactions.mjs`: real touch-pointer joystick and orbit gestures, simultaneous two-thumb control, camera-relative movement, photo tap versus drag, modal input lock, narrow and short landscape modal fit, long-caption scrolling, settings, music, and reduced-motion preference. Standard UI buttons are exercised with browser mouse click events.
- `node checks/moments-and-desktop.mjs`: photo-pose hold and return across orientation changes, kiss sequence and return, desktop WASD and camera settings, wall and pedestal collisions, corner camera bounds, and small photo previews on initial load.

Development-only scene access through React Three Fiber's root store is used to measure geometry and stage boundary cases; production code has no test globals. Runtime exceptions fail the interaction and cinematic checks.

Observed in Chrome emulation: at 390×844 the player occupies approximately 21% of screen height at spawn and 25% in the room center, with feet visible. Phone pixel ratio is capped at 1.25 and the shadow map at 512px. Portrait and landscape controls stay separate. TypeScript, ESLint, and the Vite production build pass.

These are browser emulation checks, not measurements of frame rate or thermal behavior on a physical Android phone. Test those on representative devices before making a device-performance claim. No anniversary-letter component exists in this project; the existing photo-and-memory viewer was made scrollable and safe-area aware.


## Four-room navigation

The route is School Days → College Days → University Life → Future, with reversible magical-arch transitions. Each room is 20 × 14 units; room centers are at X = 0, 22, 44, and 66. Passages are 2 units long and 4.2 units wide. School Days keeps its original content. College Days is an indoor Midnight Gallery with dusty blue paneling, dark wooden floors, a navy bench, and a constellation ceiling. University Life is an ivory and champagne Golden Gallery with lighter wood, cream seating, warm lighting, larger photo displays, and a portrait beside the exit. The fourth destination is an open-air floating island; its old floor, ceiling and walls are removed. All six passage entrances use arched openings with matching trim and labels above the arch.

`src/lib/museumLayout.ts` supplies both the rendered wall geometry and character/camera collision boundaries. Room progress updates only when a character enters the next room. The companion aligns with passage openings, shadows follow the player, and cinematic staging uses the current room's center.

Additional checks:

- `node checks/room-layout.mjs`: all three passages in both directions, solid wall sections, passage sides, outer limits, camera clearance, and a grid of doorway/corner collision samples.
- `node checks/room-navigation.mjs`: both characters approaching each arch, automatic walking transitions, indoor connections in both directions, room-label updates, hidden relocation, preserved progress and restored controls on desktop and mobile.

Both checks passed in Chrome desktop and 390×844 phone emulation. Existing mobile interaction checks were rerun for photo taps, dragging, modal scrolling, music, settings, and reduced motion.

## Mobile immersive mode

`node checks/immersive-mode.mjs` checks unsupported and denied fullscreen, a resolved request without actual fullscreen, unsupported/denied landscape lock, exit denial, system exit, an exit during a pending orientation request, responsive landscape controls, and absence of the immersive UI on desktop. Those error paths use mocked browser API responses. The same check also exercises Chrome's actual native Fullscreen API for entry and exit without mocks.

Fullscreen ownership is derived from `document.fullscreenElement`; no CSS-only state pretends to be fullscreen. A landscape lock is attempted only after confirmed fullscreen. The museum continues to use its real viewport for layout, and orientation locks acquired by the museum are released on exit. Browser/OS support still determines whether browser chrome can hide or orientation can lock. No new dependencies are used.


## Indoor galleries and arches

`node checks/gallery-interiors.mjs` verifies all six arches, renders gallery previews, opens the photo viewer from proximity prompts in both new galleries on desktop and phone layouts, checks bench collisions, and catches runtime errors. `room-navigation.mjs` now enters through the intro before exercising every passage in both directions with WASD and the mobile joystick. `room-layout.mjs` includes the benches and floral displays in collision samples.

The added photo displays reuse the existing sample images and captions; replace their configuration with personal photos when available. Decorations and wooden floorboards are instanced, local lighting is enabled only in the occupied gallery, and added frame spotlights activate only for the nearby photograph. No new dependencies or external assets were added.


Mobile entry now attempts fullscreen and landscape lock directly from the **Enter Our Little World** tap, before the intro fade. The museum root remains mounted through the transition so fullscreen is retained. Desktop entry does not request fullscreen. Unsupported or denied requests still open the museum and offer a truthful fallback with optional retry.

`node checks/automatic-immersive.mjs` checks native Chrome fullscreen from that entry tap, confirms user activation and a persistent fullscreen root, checks the landscape-lock request (mocked), exit behavior, denied/unsupported fallbacks, unchanged desktop entry, and the **Our Little Universe** destination in both the menu and location indicator.


## School Days bookshelf

The bookshelf occupies an unused section of the front wall at (-3.2, 0, 6.38), away from the doorway and central walking route. Its collision volume is shared with the museum layout; its geometry also participates in camera collision checks. The shelf uses six verified Himu edition covers by Humayun Ahmed, with Bengali titles and author names. Cover provenance is recorded in `public/books/SOURCES.md`.

Small local WebP covers load near the shelf. Larger cover references load only in the viewer. Books reuse the existing proximity prompt, camera gesture protection, input-locking modal and focus trap; the viewer uses Bengali typography and shows the selected cover, title, author and dedication. No dependencies were added.

`node checks/bookshelf.mjs` checks the six cover textures, deferred full-cover loading, proximity prompt, all title/cover matches, viewer movement lock, phone sizing, real 3D cover clicks, shelf collision and the existing photo viewer. It also tests real phone touch tap versus drag, camera isolation and scrolling on a short landscape screen. `room-layout.mjs` includes the new shelf in wall/furniture collision samples.


## Vintage photo cards

Wall photos use thin cream paper mounts, a shared 256px procedural paper texture, slight individual tilts, and a larger bottom margin. Photo images fill the print window with aspect-preserving cropping. The enlarged viewer shows the complete image on textured cream paper with the title, date and caption below it. Photos have no metallic frame, corner hardware, rounded panel outline or header divider. Book covers and the simplified book viewer are unchanged.

`node checks/vintage-photos.mjs` checks the borderless viewer and caption layout and saves wall/viewer previews. `mobile-interactions.mjs` now enters through the intro before checking joystick movement, independent camera orbit, photo tap versus drag, modal input lock, short/narrow viewport fit, scrolling, music and settings.


## Our Little Universe and bouquet finale

The last arch leads into a small grassy floating island surrounded by clouds, distant landforms and a vast gradient starfield. The three indoor galleries are hidden while outside. The exterior has no enclosing geometry. Grass, tiny flowers and cloud puffs are instanced; the stars are a single point cloud with a slow opacity change, and only six fireflies move. Battery saver omits fireflies, and reduced motion stops their drift and star twinkling.

The original 10.4-second bouquet controller and hand-to-stem alignment are preserved. Once the bouquet finishes, both actor transforms and all Chibi idle/bone updates freeze. A six-second camera pullback reveals the island and collected memories, then camera updates stop completely. Orientation changes refit the final composition once. Reduced motion shortens the reveal to 0.8 seconds. The existing ambient music gain gently drops to 0.09 without restarting playback or overriding the user's pause choice.

Opening a photo collects its original configuration. Repeated photo content is deduplicated by URL, title, caption and date (the sample galleries currently reuse images). Books are separate. Collected vintage cards form a balanced constellation around the couple. Tapping a card or using its accessible focus button opens the existing full-size photo/caption viewer. An empty collection stays empty. The anniversary overlay reserves the upper sky and scrolls internally on short screens.

Replay keeps the fullscreen host and page mounted, disposes the scene/audio, clears collected memories, controls, camera, room progress, bouquet and pose state, and starts a fresh introduction. Both characters remount in their original uniforms.

`node checks/little-universe.mjs` tests desktop and phone portrait/landscape: collecting all five unique sample memories, deduplicating a repeat from College, automatic arch arrival, the existing bouquet, exactly frozen actor/bone/camera transforms, real ray-clicks on floating cards and original captions, responsive framing and replay without a page reload. `node checks/future-bouquet.mjs` checks the actual hand grips during presentation and acceptance and the frozen keepsake afterward.


## Magical room transitions

The indoor arch faces glow softly with the next gallery's palette. Walking into an arch automatically starts the transition when both characters are nearby. No Continue/Return button is needed; the threshold waits briefly if the companion needs to catch up. The 2.6-second transition fades the room out while a small burst of instanced point sprites drifts from the arch, moves both characters while the view is fully opaque, then reveals the next gallery and restores input. The camera's orbit heading is retained and its position is updated under the fade. Arrival placement keeps the couple together and clear of walls and furniture.

The same Canvas, scene objects, music player, controls, interaction state and bouquet keepsake survive every transition. The exterior destination concludes the journey; replay returns to the introduction. Battery saver and reduced motion use a simple fade without particles; reduced motion also disables the subtle camera push. Particles use 14 points per active arch on mobile and 24 on desktop, without post-processing or simulation libraries. Fade timing uses elapsed real time so slow rendering does not stretch the transition.

`node checks/magical-transitions.mjs` (also available as `node checks/room-navigation.mjs`) checks both-character proximity, automatic threshold entry, opaque relocation, 2.6-second timing, particles, indoor connections in both directions, desktop/phone controls and music preservation, and both simple-fade fallbacks.


## Desktop camera drag

Desktop camera rotation requires holding the left mouse button and dragging the open scene. Moving the cursor alone leaves the view still. Touch retains its existing drag gesture, independent joystick, and camera-relative movement. UI, modals, cinematics, the frozen ending, and photo interactions retain their input locks.

`node checks/desktop-mouse-look.mjs` checks no rotation from cursor movement, held mouse dragging, no rotation after release, a stable character heading, camera-relative WASD, menu exclusion/input lock, and photo hover/click. Run `mobile-interactions.mjs` for the touch regression check.


## Quiet finale atmosphere

The existing star layers retain their slow, low-contrast twinkle. Fireflies now stay within 0.4 world units of the garden's shared flower-bed anchors; petals drift in small closed paths near those same beds. The clear central staging area is untouched. Phone/tablet mode uses four fireflies and three petals; desktop uses six and four. A single point batch with a 32px soft texture and one instanced petal batch use two draw calls, shared materials, and no lights, shadows, physics, or post-processing. Animation only updates the small GPU buffers, with no React state changes. Reduced motion and battery saver omit the garden effects; their existing static star fallback remains.

`node checks/finale-atmosphere.mjs` checks bounded particle paths and counts, actual draw-call/triangle cost, unchanged complete actor and camera transforms, phone portrait/landscape and desktop, dynamic reduced-motion preferences, resource disposal, and a three-second phone-viewport frame sample at 4x browser CPU throttling. This reports emulation timings rather than claiming physical phone GPU performance. Use `little-universe.mjs` for photo interactions, bouquet, navigation, collected memories, battery saver, and replay regression checks.


## Cinematic character paths

Kiss, photo, and bouquet scenes share a coordinated path: first establish clearance, turn and travel around their shared center, then approach the existing interaction positions. The return retraces those arcs. Facing changes finish before the close approach, and the companion rejoins the original side of the walking formation along a short arc. Final pose spacing, hand-grip targets, bouquet transfer, cinematic timing, and frozen ending remain unchanged.

`node checks/moment-paths.mjs` checks 576 starting/target-angle combinations, reversed starting sides in real desktop and mobile kiss/photo scenes, hand contact, return paths, rejoining from in front of the player, restored movement, automatic bouquet arrival, and the completely frozen ending. It samples actual character positions every animation frame to catch crossing paths between the final poses.


## Bouquet camera orbit

The existing bouquet camera makes one complete, eased 360-degree turn between 1.1 and 9.4 seconds of the unchanged handoff/reaction. A slightly elevated view (2.45 high, aimed at 1.0) and a responsive radius (4.6 with a responsive fit guard) keep both heads and full bodies framed. The orbit starts and finishes in the normal camera direction, avoiding extra entry/exit swings. Its 8.3-second turn is slower while the character animation duration stays unchanged. Outdoor bouquet shots bypass indoor wall bounds; other cinematics retain their original behavior. The existing entry/exit blend returns to the cake scene, and reduced motion uses a stationary camera view.

`node checks/bouquet-orbit.mjs` samples actual camera positions through desktop, phone portrait, landscape, and reduced-motion sequences. It verifies the full turn, character framing and camera focus, unchanged hand grips, no girl auto-movement, and a stopped orbit after the handoff to the cake stage.

Normal exploration uses a closer 4.2-unit portrait-phone camera (landscape stays 4.8). Cake exploration uses 5.5 in portrait instead of 6.2; cinematic framing is unchanged. Existing damping handles orientation changes.

## Stationary kiss and bouquet

Kiss and bouquet moments retain both starting world positions. Their axis comes from the actual pair, and only facing, hand/face poses, bouquet grips, and the existing camera animate. Camera-relative photo posing retains its original coordinated paths. A 1.3-unit proximity guard rejects distant starts with a short instruction; the final arrival already places the couple within range. `checks/stationary-moments.mjs` checks distant-start rejection and records every active frame on desktop/mobile to verify zero actor translation through both sequences.

Stationary kisses now solve a shared world-space lip contact point using each head?s actual rotation and character height scale. The smooth kiss envelope leans the heads together without changing either actor?s feet. The stationary-moment check measures actual mouth separation during the hold as well as zero actor translation.

`checks/cake-facing.mjs` follows the real final-room arrival on mobile and desktop, checks that the stationary girl turns toward the boy during his cake walk, and confirms normal movement resumes after his invitation. During the preceding lighting reveal she faces the cake; only her facing changes.

Cake ceremony positioning now turns both characters toward the cake in place. It retains the clear spot chosen by the player and stops both walking velocities for the entire ceremony. The ceremony browser check verifies unchanged positions in every recorded frame through positioning, lighting, wishing, and blowing.

The cake ceremony camera chooses the bisector of both cake-facing directions once on activation, eases around to that front-side angle, lowers its pitch, and uses a closer 4.4-unit minimum distance with a portrait fit guard. Pair-focused framing blends in smoothly. Existing ceremony checks cover full-body framing at narrow portrait and landscape sizes, stationary characters, and the complete candle sequence; screenshots show both faces and the cake. Normal exploration input resumes afterward.

## Romantic College and University rooms

College Days now uses rose-lilac/plum tones, while University Life uses peach, blush and champagne. Both reuse Room 1's instanced fairy lights, candle clusters and uneven petals, with palette-specific colors, shared heart-rug geometry and soft bench upholstery. The coffered ceiling grid and formal gallery subtitles were removed; photos, labels, floor/wall footprints, benches and archways retain their existing positions and collisions. Wall hearts are omitted here to keep existing photos and wall titles unobstructed. No extra point lights are added. Inactive-room flame animation is held steady; reduced-motion/battery-saver preferences are passed through. Room 1 uses the original RomanticDetails defaults.

`checks/gallery-interiors.mjs` checks the current five interior archways (the final destination is open-air), room previews, desktop/mobile photo prompts/viewers, bench collisions, overflow and runtime errors. A 4x CPU-throttled mobile browser spot check measured 241?248 draw calls / roughly 120k?136k triangles with no context loss at DPR 1; this is an emulation check rather than a physical-phone benchmark.

## First-room control hints

Entering Room 1 shows a plain, noninteractive instruction at the bottom. It uses primary-pointer detection: joystick then swipe on touch, WASD then left-button drag on desktop. Actual movement input advances the hint; actual camera azimuth/pitch input dismisses it. Looking first is remembered, so completed actions are not requested again. No card, buttons, diagrams, timers or forced pauses are used. Progress is stored in a ref, with React updates only on stage changes; the short-lived observation loop cleans up on dismissal/unmount. The existing How to explore menu action reopens the hints.

`checks/control-tutorial.mjs` verifies initial device-specific text, idle/hover exclusion, real joystick/WASD advancement, real scene-drag dismissal, menu reopening, transparent presentation and clear joystick/viewport bounds on narrow portrait and short landscape screens.

Normal companion spacing is now .88 units to the side and .22 behind (about 18% closer), including the initial spawn and tighter arch arrivals. The photo rejoin radius and blocked-side threshold match the closer formation. `checks/closer-formation.mjs` verifies standing, walking and reversing on phone/desktop. Paused cake-reveal frames leave the stationary girl untouched; NPC route clearance and active player cake collisions keep their existing margins.
