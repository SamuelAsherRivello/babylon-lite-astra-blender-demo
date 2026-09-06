## Purpose

Let players explore a Blender-authored floating village with an animated character in a polished portrait browser experience.

## ADDED Requirements

### Requirement: Authored scene
The application SHALL load the delivered village and orange character using right-handed Y-up meters, a feet-origin character, and looping Idle/Walk clips. Lighting and initial camera SHALL make the entire island and character readable. Loading and failure states SHALL provide clear feedback.

#### Scenario: Assets ready
- **WHEN** the scene finishes loading
- **THEN** the delivered world and character are visible and the character idles at the safe spawn on groundY.

### Requirement: Fitted portrait presentation
The game SHALL maintain a 9:16 frame inside both viewport dimensions, account for phone safe areas, and letterbox desktop and landscape screens. Touch controls SHALL remain within the frame after resize.

#### Scenario: Resize
- **WHEN** the viewport changes between desktop, 390 by 844 portrait, narrow portrait and landscape
- **THEN** the entire frame remains visible without page overflow.

### Requirement: Continuous safe movement
WASD and the thumb joystick SHALL move camera-relative with normalized diagonals and time-based speed. The character SHALL face travel and play Walk only during actual displacement. Movement SHALL preserve radius clearance from box/circle obstacles and the perimeter, remain on groundY, and avoid tunneling during long frames.

#### Scenario: Walk and collide
- **WHEN** the player moves toward a building, water or the island edge
- **THEN** movement stops or slides along the safe boundary and the character remains on safe ground.

### Requirement: Independent centered camera
Left-mouse world drag and touch world drag SHALL orbit a fixed world-center target without pan or player following. Mouse wheel SHALL zoom within bounds. The minimal release interface SHALL show the Citrus World heading, project subtitle, thumb joystick and movement instructions.

#### Scenario: Orbit while moving
- **WHEN** a player moves and orbits or zooms
- **THEN** the camera target remains fixed at the world center and its zoom stays within the allowed range.

### Requirement: Resilient independent input
Joystick gestures SHALL not affect the camera, including concurrent pointers. Release, pointer cancellation, capture loss, window blur and resize SHALL clear applicable active input so movement cannot remain stuck.

#### Scenario: Interrupted gesture
- **WHEN** an active joystick gesture is cancelled or the window loses focus
- **THEN** the joystick returns to rest and the character stops unless another valid current input remains.
