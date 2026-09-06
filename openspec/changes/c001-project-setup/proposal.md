## Why

The user requested a public Babylon.js and Blender demo derived from the actual repository template. The empty project needs a reproducible browser and authoring toolchain before independent world and character work can begin.

## What Changes

- Preserve the cloned template history and attribution and publish the requested public repository.
- Add a minimal TypeScript/Vite Babylon.js shell, WebGPU with WebGL fallback, test/build scripts, and static CI.
- Define the shared GLB, coordinate, animation and navigation interface for C002/C003/C004.
- Discover or install portable project-local Blender and deterministic background authoring commands.
- Configure exactly one project-local Blender MCP integration, pinned ahujasid/blender-mcp, with telemetry disabled and loopback transport.
- Establish this project's active `openspec/` root; preserve inherited `.openspec/` material as template provenance.

## Capabilities

### New Capabilities

- `project-setup`: Reproducible browser startup, fallback rendering, checks, Blender authoring and project-local MCP.

### Modified Capabilities

None.

## Impact

Root npm manifest/lockfile, TypeScript/Vite source and config, workflows, setup scripts, project-local Codex config, documentation and C001 planning. Dependencies are Babylon core/loaders, Vite, TypeScript, Vitest and OpenSpec. Local tooling includes Steam Blender 5.2.1 LTS and pinned Blender MCP. World, character and gameplay implementation are owned by subsequent changes.
