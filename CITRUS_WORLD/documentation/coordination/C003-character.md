# C003 character delivery

> Historical record from before C006: command paths and measurements below retain their original context. For current commands, use `CITRUS_WORLD/` as the application working directory and `documentation/` in place of `docs/`. See [C006 migration](../coordination/C006-structure.md).

Original orange fruit character, authored and verified with Blender **5.2.1 LTS** on 2026-09-06. Planning change: `c003-create-orange-character`; proposal, design, specs and tasks were created and strictly validated before implementation.

## Rebuild

From the repository root after C001 setup:

```powershell
npm run blender -- --background --factory-startup --python-exit-code 1 --python assets/blender/character/create_character.py
npm run blender -- --background --factory-startup --python-exit-code 1 --python assets/blender/character/verify_character.py
```

Verified here with the user-supplied executable directly:

```powershell
& 'D:/SteamLibrary/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python assets/blender/character/create_character.py
& 'D:/SteamLibrary/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python assets/blender/character/verify_character.py
```

Both commands exited 0. Each script resolves paths from its own `__file__`; the creation script clears only its independent Blender process's scene, uses fixed seed 3003 and requires no external texture, reference image, add-on or MCP session. The source deterministically rebuilds geometry and animation; Blender serialization metadata is not promised byte-identical.

## Delivery paths

| Path | Bytes at delivery | Purpose |
| --- | ---: | --- |
| `assets/blender/character/create_character.py` | 16,355 | Deterministic authoring, export, render and reopen checks |
| `assets/blender/character/verify_character.py` | 6,538 | Independent glTF skinning/animation verification and imported render |
| `assets/blender/character/character.blend` | 284,468 | Editable rigged mesh, two actions and preview studio |
| `assets/blender/character/preview.png` | 979,346 | Inspected authored scene render |
| `assets/blender/character/preview-glb.png` | 979,444 | Inspected fresh GLB import render |
| `assets/blender/character/verification.json` | 1,499 | Authoring/reopen evidence and component inventory |
| `assets/blender/character/glb-verification.json` | 756 | Independent runtime-coordinate evidence |
| `public/assets/character/character.glb` | 437,204 | Self-contained runtime model |

## Import interface

- URL: `/assets/character/character.glb`.
- Scene must use right-handed coordinates. Place imported character with identity scale and rotation; forward is **runtime +Z**, authored Blender -Y. No art offsets or corrective rotations.
- Root node/rig: `CharacterRoot`; fixed root bone: `Root`. Skinned mesh: `OrangeCharacter`. Bones: `Root`, `Body`, `Boot.L`, `Boot.R`, `Leaf`.
- One skinned mesh, 5,634 authored vertices, 11,056 triangles and 11 material primitives. Material names describe the orange body, ivory eyes, espresso face, catchlights, freckles, vermilion boots, wine soles, warm stitching, cinnamon stem, green leaf and lime ridge. Source component names remain recorded in `verification.json`; vertex groups preserve rigid part editing in the joined mesh.
- Rest runtime bounds in meters: X `[-0.349140, 0.349140]`, Y `[0, 1.028634]`, Z `[-0.292270, 0.346000]`. Ground origin is centered between the boot bones. Both resting sole bases reach Y=0. Eye centroid Z=+0.275 confirms the visible face is forward.
- Only character geometry/skin/materials/animation are exported. Preview camera, lights and floor remain in the `.blend`. No images or external buffer URIs occur in the GLB.

## Animation interface and evidence

| Clip | Time range | Behavior | Independent GLB samples |
| --- | --- | --- | ---: |
| `Idle` | 0–2 seconds | Subtle body breathing and leaf sway; boots planted | 121 |
| `Walk` | 0–0.8 seconds | Alternating boot lift/stride, body bob/sway and leaf bounce | 49 |

Both clips loop in place. C004 supplies world translation and heading. Start the desired animation group with looping enabled, stopping the other group. Root channels emitted by the exporter contain only identity values; there is no root motion. The script verifies every root channel value.

The creation script samples all 61 Idle and 25 Walk authoring frames, saves/reopens the `.blend`, and repeats the same checks. The independent verifier reads binary glTF accessors, reconstructs runtime node transforms and weighted skinning, and samples exact keys plus half-frames. Minimum Y is **0** across both clips; maximum endpoint error is below **1.5e-17 meters**. Intermediate poses change visibly (maximum quarter-cycle motion: Idle 0.0225 m; Walk 0.0856 m). The stable root remains identity at every sample.

Both PNGs were visually inspected. Large expressive eyes, arched brows, smile, freckles, stem, folded green leaf and chunky red boots are readable; the fresh GLB import preserves the authored appearance. The coordinator also inspected the authored preview and found the visual quality suitable.

## Acceptance boundary

Strict `openspec validate c003-create-orange-character --strict` passes. C003 delivers and verifies the asset; C004 owns actual browser controls, runtime lighting, collision clearance and animation switching acceptance. No browser or physical-device result is claimed here. Reference inputs and setup/global configuration are excluded from this delivery. Commit only the C003 owned paths; no push was performed by this task.
