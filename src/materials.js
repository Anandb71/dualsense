import * as THREE from 'three';

/** Finishes sampled visually from the iFixit reference photographs. */
export const MATERIAL_PRESETS = Object.freeze({
  shell: { color: '#e9e9e6', roughness: 0.43, metalness: 0, clearcoat: 0.13, clearcoatRoughness: 0.42 },
  rearShell: { color: '#e5e5e2', roughness: 0.56, metalness: 0, clearcoat: 0.06, clearcoatRoughness: 0.5 },
  touchpad: { color: '#e6e6e4', roughness: 0.48, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.4 },
  bridge: { color: '#22252a', roughness: 0.49, metalness: 0, clearcoat: 0.17, clearcoatRoughness: 0.4 },
  rubber: { color: '#25262a', roughness: 0.88, metalness: 0, clearcoat: 0 },
  trigger: { color: '#23252a', roughness: 0.34, metalness: 0, clearcoat: 0.28, clearcoatRoughness: 0.24 },
  trim: { color: '#171a20', roughness: 0.25, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.22 },
  buttonCaps: { color: '#e2e5e7', roughness: 0.21, metalness: 0, clearcoat: 0.92, clearcoatRoughness: 0.15, ior: 1.48 },
  buttonInserts: { color: '#e2e3e4', roughness: 0.58, metalness: 0, clearcoat: 0.05 },
  glyphs: { color: '#81858a', roughness: 0.58, metalness: 0 },
  lightbar: { color: '#b5d9ff', roughness: 0.36, metalness: 0, clearcoat: 0.26, clearcoatRoughness: 0.3, emissive: '#448cff', emissiveIntensity: 1.6 },
  port: { color: '#45484c', roughness: 0.38, metalness: 0.64 },
});

export const CONTROLLER_MATERIAL_PRESETS = MATERIAL_PRESETS;

// Named finishes in the attributed Taohid Animation glTF. The source contains
// independent cap meshes and glyph decals, so the caps must reveal their cores.
const SOURCE_MATERIAL_ROLES = Object.freeze({
  VRayMtl55: 'rearShell',
  front_body: 'shell',
  'front_body.001': 'bridge',
  'front_body.002': 'trim',
  VRayMtl33: 'rubber',
  VRayMtl37: 'trigger',
  'Material.002': 'buttonCaps',
  'Material.005': 'trim',
  'Material.006': 'trim',
  'Material.007': 'buttonInserts',
  'Material.008': 'lightbar',
  'Material.009': 'buttonInserts',
  'Material.010': 'lightbar',
});

const MAP_PROPERTIES = [
  'map', 'alphaMap', 'aoMap', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap',
  'emissiveMap', 'displacementMap', 'lightMap', 'clearcoatMap', 'clearcoatNormalMap',
  'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap', 'specularColorMap',
  'specularIntensityMap', 'sheenColorMap', 'sheenRoughnessMap',
];
const SHELL_ROLES = new Set(['shell', 'rearShell', 'touchpad']);
const normalize = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').toLowerCase();
const hash = (x, y, seed = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

function lineDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}

/**
 * Seamless, deterministic height texture of tiny circle/cross/square/triangle
 * mould marks. This is a bump map, never a printed color map. It also works
 * without a browser canvas. Accepts options, or a THREE namespace and options.
 */
export function createGripTexture(threeOrOptions = {}, additionalOptions = {}) {
  const namespace = threeOrOptions?.DataTexture ? threeOrOptions : THREE;
  const options = (threeOrOptions?.DataTexture ? additionalOptions : threeOrOptions) || {};
  const size = Math.max(128, Math.min(1024, Math.round(options.size || 512)));
  const cells = Math.max(4, Math.round(options.cells || 8));
  const data = new Uint8Array(size * size * 4);
  const cellSize = size / cells;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const cx = Math.floor(px / cellSize);
      const cy = Math.floor(py / cellSize);
      let x = (px / cellSize - cx - 0.5) * 2 - (hash(cx, cy, 1) - 0.5) * 0.2;
      let y = (py / cellSize - cy - 0.5) * 2 - (hash(cx, cy, 2) - 0.5) * 0.2;
      const angle = (hash(cx, cy, 3) - 0.5) * 1.0;
      const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
      y = x * Math.sin(angle) + y * Math.cos(angle);
      x = rotatedX;
      const radius = 0.46 + hash(cx, cy, 4) * 0.06;
      let distance;
      switch (Math.floor(hash(cx, cy, 5) * 4)) {
        case 0:
          distance = Math.abs(Math.hypot(x, y) - radius);
          break;
        case 1:
          distance = Math.min(lineDistance(x, y, -radius, -radius, radius, radius), lineDistance(x, y, -radius, radius, radius, -radius));
          break;
        case 2:
          distance = Math.abs(Math.max(Math.abs(x), Math.abs(y)) - radius);
          break;
        default:
          distance = Math.min(
            lineDistance(x, y, 0, -radius * 1.13, radius, radius * 0.7),
            lineDistance(x, y, radius, radius * 0.7, -radius, radius * 0.7),
            lineDistance(x, y, -radius, radius * 0.7, 0, -radius * 1.13),
          );
      }
      const edge = Math.max(0, Math.min(1, (0.076 - distance) * cellSize / 2));
      const height = Math.round(122 + edge * 47 + (hash(px, py, 8) - 0.5) * 5);
      const offset = (py * size + px) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = height;
      data[offset + 3] = 255;
    }
  }

  const texture = new namespace.DataTexture(data, size, size, namespace.RGBAFormat, namespace.UnsignedByteType);
  texture.name = 'DualSense microscopic moulded grip symbols';
  texture.wrapS = texture.wrapT = namespace.RepeatWrapping;
  texture.magFilter = namespace.LinearFilter;
  texture.minFilter = namespace.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = namespace.NoColorSpace;
  const repeat = options.repeat ?? 20;
  texture.repeat.set(Array.isArray(repeat) ? repeat[0] : repeat, Array.isArray(repeat) ? repeat[1] : repeat);
  texture.anisotropy = options.anisotropy ?? 8;
  texture.needsUpdate = true;
  return texture;
}

function inferRole(mesh, material, options) {
  const override = options.roleOverrides?.[mesh.name] ?? options.roleOverrides?.[material.name];
  const explicit = override ?? mesh.userData?.materialRole ?? material.userData?.materialRole;
  if (explicit) return explicit;
  const custom = options.classifyMaterial?.(material, mesh);
  if (custom) return custom;

  // A symbol or decal must never inherit the finish of its parent button/body.
  const name = normalize(`${material.name} ${mesh.name}`);
  if (/decal|label|lettering|printed|engraving|glyph|symbol|button icon/.test(name)) return 'preserve';
  const part = normalize(mesh.userData?.part);
  const control = normalize(mesh.userData?.control);
  if (control === 'lights') return 'lightbar';
  if (control === 'touchpad') return 'touchpad';
  if (control.includes('stick')) return 'rubber';
  if (part === 'cap') return 'buttonCaps';
  if (control === 'ps' || control === 'mute') return 'trim';
  if (/ps mount|mute mount|white shell detail (?:[7-9]|1[0-5])\b/.test(name)) return 'trim';
  if (SOURCE_MATERIAL_ROLES[material.name]) return SOURCE_MATERIAL_ROLES[material.name];
  if (/light\s*(bar|strip|guide)|led\b|emissive|blue\s*light/.test(name)) return 'lightbar';
  if (/thumb\s*stick|analog|analogue|joystick|stick\s*(cap|rubber)|rubber/.test(name)) return 'rubber';
  if (/touch\s*pad|track\s*pad/.test(name)) return 'touchpad';
  if (/button.*(glass|clear|cap)|clear.*button|transparent.*button|d\s*pad|directional|face\s*button|action\s*button/.test(name)) return 'buttonCaps';
  if (/button\s*(insert|base|inner)/.test(name)) return 'buttonInserts';
  if (/trigger|bumper|shoulder|\b[lr][12]\b/.test(name)) return 'trigger';
  if (/usb|jack|connector|screw|metal\s*port/.test(name)) return 'port';
  if (/rear\s*(shell|housing|body)|back\s*(shell|housing|body)|grip\s*(shell|white)|white\s*grip/.test(name)) return 'rearShell';
  if (/bridge|black\s*(body|plastic|shell|housing)|center\s*(body|panel)|centre\s*(body|panel)/.test(name)) return 'bridge';
  if (/trim|rim|bezel/.test(name)) return 'trim';
  if (/shell|housing|white\s*plastic|white\s*body|front\s*(plate|body)|body\s*white/.test(name)) return 'shell';
  return 'preserve';
}

function clonePhysical(source) {
  if (source.isMeshPhysicalMaterial) return source.clone();
  const material = new THREE.MeshPhysicalMaterial();
  if (source.isMeshStandardMaterial) {
    THREE.MeshStandardMaterial.prototype.copy.call(material, source);
  } else {
    // Non-PBR imported labels remain untouched unless explicitly assigned a role.
    THREE.Material.prototype.copy.call(material, source);
    if (source.color) material.color.copy(source.color);
    for (const key of MAP_PROPERTIES) if (source[key]) material[key] = source[key];
  }
  material.name = source.name;
  return material;
}

/**
 * Tune identifiable parts, preserving the imported UVs, labels and maps.
 * Unknown materials are retained by default. Pass roleOverrides keyed by exact
 * material/mesh names for models with generic exported node names.
 *
 * Returns part arrays, traversal diagnostics, live appearance controls, and a
 * cleanup function. No geometry is changed or invented by this material pass.
 */
export function applyControllerMaterials(root, options = {}) {
  if (!root?.traverse) throw new TypeError('applyControllerMaterials expects a THREE.Object3D.');

  const parts = Object.fromEntries([...Object.keys(MATERIAL_PRESETS), 'preserve'].map((role) => [role, []]));
  const materials = [];
  const sourceMaterials = new Set();
  const sourceBindings = [];
  const materialCache = new Map();
  const diagnostics = { meshCount: 0, sourceMaterialCount: 0, tunedMaterialCount: 0, preservedMaterialCount: 0, roles: {}, entries: [], warnings: [] };
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const modelSpan = Math.max(size.x, size.y, size.z) || 1;
  let gripTexture;

  root.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.material) return;
    sourceBindings.push({ mesh, original: mesh.material, renderOrder: mesh.renderOrder, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow });
    diagnostics.meshCount += 1;
    mesh.castShadow = options.castShadow ?? true;
    mesh.receiveShadow = options.receiveShadow ?? true;
    const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const tuned = originals.map((source) => {
      sourceMaterials.add(source);
      let role = inferRole(mesh, source, options);
      if (!MATERIAL_PRESETS[role] && role !== 'preserve') {
        diagnostics.warnings.push(`Unknown finish "${role}" on ${mesh.name || source.name}; retained source material.`);
        role = 'preserve';
      }
      if (!parts[role].includes(mesh)) parts[role].push(mesh);
      diagnostics.roles[role] = (diagnostics.roles[role] || 0) + 1;
      diagnostics.entries.push({ node: mesh.name, sourceMaterial: source.name, role, preservedMaps: MAP_PROPERTIES.filter((key) => source[key]) });
      if (role === 'preserve') {
        if (/decal|symbol|label/.test(normalize(mesh.name))) mesh.renderOrder = 2;
        diagnostics.preservedMaterialCount += 1;
        return source;
      }

      if (role === 'buttonCaps') {
        mesh.renderOrder = 3;
        mesh.castShadow = false;
      }

      // An imported shared material can serve unrelated body and control meshes.
      // Cache by role as well as source, so tuning one never bleeds into another.
      const canGrip = role === 'rearShell' && mesh.geometry?.attributes?.uv && !source.bumpMap && options.gripTexture !== false;
      const key = `${source.uuid}:${role}:${Boolean(canGrip)}`;
      if (materialCache.has(key)) return materialCache.get(key);
      const material = clonePhysical(source);
      const preset = { ...MATERIAL_PRESETS[role], ...options.presets?.[role] };

      for (const [property, value] of Object.entries(preset)) {
        if (property === 'color') {
          // Color maps often contain button legends, shell printing and AO.
          // Preserve their original multiplier unless a tint is intentional.
          if (!source.map || options.tintMappedMaterials) material.color.set(value);
        } else if (property === 'emissive') {
          material.emissive.set(value);
        } else if (property === 'roughness' && source.roughnessMap) {
          material.roughness = source.roughness;
        } else if (property === 'metalness' && source.metalnessMap) {
          material.metalness = source.metalness;
        } else {
          material[property] = value;
        }
      }
      material.envMapIntensity = options.envMapIntensity ?? 0.9;
      material.userData = { ...source.userData, controllerRole: role };
      if (SHELL_ROLES.has(role) && options.shellColor) material.color.set(options.shellColor);
      if (role === 'buttonCaps') {
        // Clearcoat gives a lens highlight over an intact printed glyph map.
        // Transmission is restricted to separate, explicitly clear cap meshes.
        const sourceHasBuriedDecals = source.name === 'Material.002' || mesh.userData?.part === 'cap';
        const separateClearCap = !source.map && /glass|clear|transparent/i.test(`${source.name} ${mesh.name}`);
        if (sourceHasBuriedDecals) {
          // The glyph planes use alpha blending, which Three's transmission
          // framebuffer excludes. Alpha caps retain the real underlying glyphs.
          material.color.set('#e9edf0');
          material.transparent = true;
          material.opacity = options.capOpacity ?? 0.26;
          material.depthWrite = false;
          material.side = THREE.FrontSide;
          material.roughness = 0.14;
          material.transmission = 0;
        } else if (separateClearCap) {
          material.transmission = options.capTransmission ?? 0.16;
          material.thickness = modelSpan * 0.0025;
          material.attenuationColor.set('#f4f6f7');
          material.attenuationDistance = modelSpan * 0.15;
        }
      }
      if (role === 'lightbar') {
        material.emissive.set(options.lightColor ?? preset.emissive);
        material.emissiveIntensity = options.lightIntensity ?? preset.emissiveIntensity;
        material.toneMapped = true;
        if (source.name === 'Material.010') {
          material.color.set('#d5dfe7');
          material.emissive.set('#d5e4ed');
          material.emissiveIntensity = 0.65;
        }
      }
      if (canGrip) {
        gripTexture ??= createGripTexture({ repeat: options.gripRepeat ?? 20, anisotropy: options.anisotropy ?? 8 });
        material.bumpMap = gripTexture;
        material.bumpScale = options.gripBumpScale ?? modelSpan * 0.000045;
        if (source.normalMap) {
          // Three normally chooses normalMap OR bumpMap. Add only the tiny
          // moulded symbols after its existing atlas normal has been evaluated.
          material.onBeforeCompile = (shader, renderer) => {
            source.onBeforeCompile?.call(material, shader, renderer);
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <normal_fragment_maps>',
              `#include <normal_fragment_maps>
              #if defined( USE_BUMPMAP ) && ( defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_NORMALMAP_OBJECTSPACE ) )
                normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd(), faceDirection );
              #endif`,
            );
          };
          material.customProgramCacheKey = () => 'dualsense-preserved-normal-with-moulded-grip-v1';
        }
      }
      material.needsUpdate = true;
      materialCache.set(key, material);
      materials.push(material);
      return material;
    });
    mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
  });

  diagnostics.sourceMaterialCount = sourceMaterials.size;
  diagnostics.tunedMaterialCount = materials.length;
  const lightMaterials = materials.filter((material) => material.userData.controllerRole === 'lightbar');
  const shellMaterials = materials.filter((material) => SHELL_ROLES.has(material.userData.controllerRole));

  return {
    parts,
    materials,
    diagnostics,
    get gripTexture() { return gripTexture; },
    setLightColor(color) {
      lightMaterials.forEach((material) => material.emissive.set(color));
    },
    setLightIntensity(intensity) {
      const value = Math.max(0, Number(intensity) || 0);
      lightMaterials.forEach((material) => { material.emissiveIntensity = value; });
    },
    setShellColor(color) {
      shellMaterials.forEach((material) => material.color.set(color));
    },
    dispose() {
      // Restore original imported materials; their shared textures remain owned
      // by the model loader and must not be disposed by this finishing layer.
      sourceBindings.forEach(({ mesh, original, renderOrder, castShadow, receiveShadow }) => {
        mesh.material = original;
        mesh.renderOrder = renderOrder;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      });
      materials.forEach((material) => material.dispose());
      gripTexture?.dispose();
    },
  };
}
