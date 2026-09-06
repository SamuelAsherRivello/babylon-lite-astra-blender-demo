## Purpose

Provide a reproducible browser and local Blender authoring foundation so independent asset tasks can produce compatible game content.

## ADDED Requirements

### Requirement: Browser renderer startup
The application SHALL prefer WebGPU, fall back to WebGL when unavailable or initialization fails, and show the selected renderer or a readable startup error. It SHALL resize with its canvas and use a right-handed meter-based world.

#### Scenario: WebGPU is unavailable
- **WHEN** the browser has no usable WebGPU adapter
- **THEN** the shell renders using WebGL and reports WebGL.

#### Scenario: WebGPU initialization fails
- **WHEN** WebGPU setup throws
- **THEN** the failed engine is disposed and WebGL startup is attempted.

#### Scenario: Supported WebGPU
- **WHEN** WebGPU initialization succeeds
- **THEN** the shell renders using WebGPU and reports WebGPU.

### Requirement: Reproducible project checks
A fresh clone SHALL install from its lockfile and expose documented test, type-check and production-build commands. CI SHALL run these checks and produce static output.

#### Scenario: Clean project setup
- **WHEN** a developer runs the documented install and check commands on supported Node
- **THEN** tests and type checks pass and the build generates `dist` without a backend.

### Requirement: Independent asset authoring
The project SHALL document a GLB contract with meters, Y-up runtime coordinates, feet-centered character origin, named Idle and Walk clips, and world navigation JSON. It SHALL provide a background Blender command usable by independent world and character scripts.

#### Scenario: Background export entry
- **WHEN** a developer runs the Blender wrapper with a Python authoring script
- **THEN** the discovered project-local or explicitly selected Blender executes the script and returns its process result.

### Requirement: Project-local Blender MCP
The project SHALL configure exactly one pinned Blender MCP integration with telemetry disabled and loopback-only communication, without modifying global application configuration. Rebuild scripts SHALL also work independently of MCP.

#### Scenario: Local integration connects
- **WHEN** the local Blender bridge and MCP server are started from the project tooling
- **THEN** the integration can inspect a Blender scene through localhost and exposes the pinned tool implementation.

### Requirement: Template provenance and public repository
The repository SHALL retain the template history, MIT attribution and creator banner, and publish setup commits to the explicitly requested public repository.

#### Scenario: Published baseline
- **WHEN** setup is committed and normally pushed
- **THEN** the public repository contains the template ancestor and reproducible setup without local tools or credentials.
