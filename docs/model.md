# Model

`public/models/dualsense.glb` is the only geometry the viewer loads.

- Format: binary glTF 2.0. No compression extension and no external decoder.
- Size: 6,244,172 bytes.
- Geometry: 81 mesh nodes, 104,240 triangles, 62,476 vertices.
- Materials: 20, with textures embedded in the file.
- Axes: front is +Z, up is +Y, left/right is X. Transforms are baked. The model is centered.
- Bounds: min `[-2.633, -1.711, -1.079]`, max `[2.633, 1.711, 1.079]`.
- Root node: `DualSense_Interactive`. No skeleton and no embedded animation.
- `extras.control` and `extras.part` are read as `userData.control` and `userData.part`.

The file is exterior geometry. An exploded view is a separation of those exterior parts, not a teardown of the board or motors.

## Grouping

Group nodes that share `userData.control` before moving them, so a cap and its symbol stay together. Named controls include `left-stick`, `right-stick`, `touchpad`, `triangle`, `circle`, `cross`, `square`, `up`, `down`, `left`, `right`, `l1`, `l2`, `r1`, `r2`, `create`, `options`, `ps`, `mute`, and `lights`.

Structural parts include `back-shell`, `white-shell-left`, `white-shell-right`, `black-front-shell`, `left-stick-well`, and `right-stick-well`. Small `Object_*` nodes are ports and labels; keep them with the nearest structural group. Speaker holes are the `white-shell-detail-*` nodes above the PS button.

## Materials

| Material | Used for |
| --- | --- |
| `VRayMtl55` | Rear shell |
| `front_body` | White shell and touchpad |
| `front_body.001` | Graphite center bridge |
| `front_body.002` | Stick wells |
| `VRayMtl33` | Analog sticks |
| `VRayMtl37` | Shoulder bumpers and triggers |
| `Material.002` | Face-button and D-pad caps |
| `Material.009` | D-pad bodies |
| `1001`, `1001.002` | Symbols and decals |
| `Material.008` | Touchpad light surround |
| `Material.010` | Player indicator |

The source cap material is opaque. The viewer treats the caps as clear so the symbols underneath read. Keep the decal UVs and alpha maps. The source plastics are more metallic than the real controller; the viewer lowers that response without changing the geometry.

The rear normal map is a fine generic grain. It does not reproduce the molded PlayStation symbols on the real grip.

Node bounds and triangle counts are listed in [part-inventory.json](part-inventory.json).
