# looping-water-flow Specification

## Purpose

Make the village's horizontal river and vertical waterfalls visibly flow with continuous repeating surface detail while preserving their existing appearance and gameplay compatibility.

## Requirements

### Requirement: Readable directional water texture
The water SHALL display moving surface detail along the horizontal river's length and downward along both vertical waterfalls. Movement SHALL be perceptible at the initial gameplay framing within five seconds of observation, and SHALL remain attached to each surface during camera orbit. Falling water SHALL appear faster than the gentle river current. Surface motion SHALL supplement the existing turquoise color, sunlight sheen and actual scene reflections.

#### Scenario: Watching the horizontal river
- **WHEN** the loaded scene is observed from its initial framing for five seconds
- **THEN** identifiable water detail progresses along the river length in a consistent direction rather than merely flickering in place or drifting sideways across its banks.

#### Scenario: Watching each vertical portion
- **WHEN** the camera exposes either waterfall for five seconds
- **THEN** identifiable water detail travels from the top toward the bottom of that fall
- **AND** both waterfalls show downward flow despite their opposite facing directions.

### Requirement: Continuous repeating flow
Each water surface SHALL repeat its moving pattern indefinitely without a visible snap, pause, reversal, flash or blank interval at the loop boundary. Water SHALL remain visually connected at river-to-fall edges without a flashing seam or exposed gap. Detail SHALL stay confined to the authored water surfaces.

#### Scenario: Crossing a complete loop
- **WHEN** each surface is observed through at least two complete texture cycles, including the frames immediately before and after rollover
- **THEN** the apparent current remains continuous with no visible reset or interruption.

#### Scenario: Inspecting the water edges
- **WHEN** the user orbits to inspect the river banks and either waterfall lip during animation
- **THEN** the original surface silhouettes remain intact, with no moving detail spilling onto terrain or gaps appearing between water portions.

### Requirement: Stable timing and compatible ownership
Water flow SHALL remain consistent at 30, 60 and 120 frames per second for equal active durations, and SHALL resume after tab suspension without a disruptive jump. It SHALL work on WebGPU and WebGL fallback without changing movement, collision, camera framing or the existing smoke and foliage behavior. Reinitialization SHALL restore one functioning set of water effects, and disposal SHALL release resources owned by the flow effect.

#### Scenario: Different rendering rates
- **WHEN** equal active durations are simulated at 30, 60 and 120 frames per second
- **THEN** water reaches equivalent positions within its repeating pattern within numerical tolerance.

#### Scenario: Suspension and reload
- **WHEN** the tab is suspended, resumed and then the scene is reloaded
- **THEN** flow resumes smoothly and the new scene contains one set of water effects with no surviving updates from the old scene.

#### Scenario: Renderer and gameplay compatibility
- **WHEN** the game runs on each available renderer and the user moves, orbits and zooms
- **THEN** water remains animated and correctly oriented while controls, framing, reflections, smoke and foliage continue to work.

### Requirement: Rendered evidence of flow
Verification SHALL demonstrate actual visible motion on the river and both waterfalls, including loop rollover; changing numeric offsets alone SHALL NOT count as visual proof. Evidence SHALL identify the browser, renderer, viewport and observed cycle durations, report unavailable coverage explicitly, and record performance against the existing approximately 60 fps target.

#### Scenario: Reviewing delivery
- **WHEN** the implemented change is presented for review
- **THEN** browser recordings or time-separated rendered frames with motion observations demonstrate flow direction and continuity on all three surfaces
- **AND** verification reports renderer coverage and measured performance with all existing effects active.

### Requirement: Measured Chrome rendering performance
The implementation SHALL target 60 fps in installed Chrome with all effects active, preserve the existing framing, and report measured before/after average fps and p95 frame intervals under the same foreground workload. Any remaining shortfall SHALL be stated explicitly.

#### Scenario: Reviewing optimization results
- **WHEN** the optimized scene is measured at the recorded viewport after warmup
- **THEN** the report compares idle and interactive performance with the baseline and identifies the browser, renderer and hardware.

### Requirement: Stable 2D elements during startup
The initial page SHALL apply the final UI styles before painting controls and headings, even when the game script is delayed. Static 2D elements SHALL retain their size and position when the game becomes ready.

#### Scenario: Slow initial game load
- **WHEN** the game entry script is delayed and subsequently allowed to initialize
- **THEN** the frame, heading and joystick are styled before initialization and do not jump when the ready state is reached in Chrome and Edge.

### Requirement: Sleeping while unfocused
When the game loses window focus or its document becomes hidden, it SHALL stop its render loop, simulation, animated effects and reflection passes, clear movement input, and show a subtle centered "Sleeping" label over a black fade covering the entire page. Sleeping SHALL use event-driven wake-up without recurring polling or decorative animation. The scene MAY remain allocated in memory for fast resumption.

#### Scenario: Leaving the game
- **WHEN** the window blurs or the document becomes hidden
- **THEN** the game has zero registered render-loop callbacks and its frame, player, water and reflection counters stop advancing
- **AND** the full-page overlay appears and any CSS loading animation pauses.

#### Scenario: Returning to the game
- **WHEN** the document is visible and regains focus
- **THEN** the overlay fades away, exactly one render loop resumes, and suspended wall time does not cause a movement or animation jump
- **AND** input held before sleep does not remain stuck.

#### Scenario: Reduced motion and cleanup
- **WHEN** reduced motion is requested or the game is disposed
- **THEN** the overlay transition is disabled for reduced motion, and disposal removes the activity listeners without leaving extra render loops.

#### Scenario: Resizing while asleep
- **WHEN** the viewport changes size while the game is sleeping
- **THEN** the game preserves its render buffer without drawing new frames
- **AND** it applies the new render dimensions when focus returns.
