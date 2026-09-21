# Controller model integration notes

- URL: `/models/dualsense.glb`
- Format: binary glTF 2.0; no required compression extension or external decoder.
- Size: 6,244,172 bytes.
- Geometry: 81 mesh nodes, 104,240 triangles, 62,476 vertices after splitting.
- Materials: 20; embedded PNG textures: 7.
- Local coordinate system: front faces +Z, top is +Y, left/right is X. Geometry transforms are baked and the model is centered.
- Bounds: min `[-2.632586, -1.711029, -1.079234]`, max `[2.632614, 1.711029, 1.079234]`.
- Overall size: `[5.265200, 3.422059, 2.158469]`.
- The GLB root is `DualSense_Interactive`; every mesh is a direct child. No skeleton or embedded animation.
- Node `extras.control` and `extras.part` become Three.js `userData.control` and `userData.part`.
- `part-inventory.json` records every node's bounds, material, and triangle count. `model-metadata.json` contains the source glTF JSON chunk for inspection.

## Grouping parts

Group all nodes with the same `userData.control` before animation so caps and their decals stay together. The named controls include `left-stick`, `right-stick`, `touchpad`, `triangle`, `circle`, `cross`, `square`, `up`, `down`, `left`, `right`, `l1`, `l2`, `r1`, `r2`, `create`, `options`, `ps`, `mute`, and `lights`.

Structural nodes have part names including `back-shell`, `white-shell-left`, `white-shell-right`, `black-front-shell`, `left-stick-well`, and `right-stick-well`. Small unnamed `Object_*` details include ports and labels; leave them attached to the nearest structural group. Speaker-hole pieces are the `white-shell-detail-*` nodes near the center above the PS button.

The prepared model contains exterior geometry, not the full internal circuit board and motors. An exploded arrangement should be described as a view of the exterior components.

## Materials

| Material | Components |
| --- | --- |
| `VRayMtl55` | Rear shell, normal mapped |
| `front_body` | White shell pieces and touchpad |
| `front_body.001` | Black central front saddle |
| `front_body.002` | Stick wells |
| `VRayMtl33` | Analog sticks, normal mapped |
| `VRayMtl37` | Shoulder bumpers and triggers, normal mapped |
| `Material.002` | Translucent face-button and D-pad caps |
| `Material.009` | D-pad bodies |
| `1001`, `1001.002` | Textured symbols and decals, alpha blended |
| `Material.008` | Touchpad light surround |
| `Material.010` | Player indicator |

The source cap material is opaque even though its symbols sit below the clear cap. Use a clear material response to expose those symbols. Preserve the UV maps and alpha maps on the decal materials. The source's white and black plastics have overly metallic parameters; the viewer can tune those while preserving geometry and texture detail.

`normal-0.png`, `normal-4.png`, and `normal-6.png` are unchanged embedded source texture images extracted for inspection. The rear texture (`normal-0.png`) uses fine generic grid grain; it does not resolve the actual grip's PlayStation-symbol pattern.

## Visual reference findings

The actual iFixit photographs show an off-white shell with subtle texture, dark satin central saddle, concave black rubber analog caps with rough rims, clear glossy face and D-pad caps over pale cores with gray symbols, and glossy shoulder components. The grip macro shows a dense molded pattern of PlayStation symbols. Blue light should read as a slim line beside the touchpad.

See `../../ASSET-CREDITS.md` for attribution and licensing.
