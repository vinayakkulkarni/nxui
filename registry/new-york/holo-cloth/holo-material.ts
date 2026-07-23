import * as THREE from 'three';
import { makeGrainRoughnessMap } from './textures';

export interface HoloUniforms {
  uHoloIntensity: THREE.IUniform<number>;
  uHoloScale: THREE.IUniform<number>;
  uBandFreq: THREE.IUniform<number>;
  uRadialFreq: THREE.IUniform<number>;
  uSaturation: THREE.IUniform<number>;
  uHueShift: THREE.IUniform<number>;
  uSparkle: THREE.IUniform<number>;
  uSpecTint: THREE.IUniform<number>;
  uSurfaceMap: THREE.IUniform<THREE.Texture>;
  uSurfaceOpacity: THREE.IUniform<number>;
  uCavityAmount: THREE.IUniform<number>;
  uCornerRound: THREE.IUniform<number>;
  uClothSize: THREE.IUniform<THREE.Vector2>;
}

export interface HoloMaterial {
  material: THREE.MeshPhysicalMaterial;
  uniforms: HoloUniforms;
}

/**
 * Holographic sticker fabric:
 *  - MeshPhysicalMaterial base: iridescence (thin-film), sheen (fabric),
 *    clearcoat (laminated sticker depth), matte roughness, woven normal map
 *  - injected diffraction layer: micro-flake cells whose hue sweeps with the
 *    view angle, like the diffraction grating on holo foil
 */
export function createHoloMaterial(
  surfaceTexture: THREE.Texture,
): HoloMaterial {
  // the bump/normal map is loaded asynchronously by the engine (default
  // scratch texture or a user upload) — none at creation time
  const roughnessMap = makeGrainRoughnessMap();

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#9aa1ad'),
    metalness: 0.95,
    roughness: 0.1,
    roughnessMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    sheen: 0.35,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color('#cfd6ff'),
    iridescence: 1.0,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 480],
    side: THREE.DoubleSide,
  });

  const uniforms: HoloUniforms = {
    uHoloIntensity: { value: 1.0 },
    uHoloScale: { value: 110 },
    uBandFreq: { value: 3.0 },
    uRadialFreq: { value: 1.6 },
    uSaturation: { value: 0.8 },
    uHueShift: { value: 0.0 },
    uSparkle: { value: 0.6 },
    uSpecTint: { value: 0.85 },
    uSurfaceMap: { value: surfaceTexture },
    uSurfaceOpacity: { value: 1.0 },
    uCavityAmount: { value: 0 },
    uCornerRound: { value: 0 },
    uClothSize: { value: new THREE.Vector2(3, 3) },
  };

  // rounded-corner cutout edges resolve smoothly under the MSAA target
  material.alphaToCoverage = true;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader =
      'varying vec2 vHoloUv;\nattribute float aCavity;\nvarying float vCavity;\n' +
      shader.vertexShader.replace(
        '#include <uv_vertex>',
        '#include <uv_vertex>\n\tvHoloUv = uv;\n\tvCavity = aCavity;',
      );

    shader.fragmentShader =
      /* glsl */ `
      varying vec2 vHoloUv;
      uniform float uHoloIntensity;
      uniform float uHoloScale;
      uniform float uBandFreq;
      uniform float uRadialFreq;
      uniform float uSaturation;
      uniform float uHueShift;
      uniform float uSparkle;
      uniform float uSpecTint;
      uniform sampler2D uSurfaceMap;
      uniform float uSurfaceOpacity;
      varying float vCavity;
      uniform float uCavityAmount;
      uniform float uCornerRound;
      uniform vec2 uClothSize;

      float holoHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      vec3 holoHsv2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        rgb = rgb * rgb * (3.0 - 2.0 * rgb); // smooth rainbow
        return c.z * mix(vec3(1.0), rgb, c.y);
      }
      ` +
      shader.fragmentShader
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
        {
          // rounded-corner cutout: rounded-rect SDF in cloth space; sharp at 0
          if (uCornerRound > 0.0) {
            vec2 cp = (vHoloUv - 0.5) * uClothSize;
            float cr = uCornerRound * 0.5 * min(uClothSize.x, uClothSize.y);
            vec2 cq = abs(cp) - (0.5 * uClothSize - vec2(cr));
            float cd = length(max(cq, vec2(0.0))) - cr;
            float cEdge = fwidth(cd) + 1e-4;
            float cMask = 1.0 - smoothstep(-cEdge, cEdge, cd);
            if (cMask <= 0.0) discard;
            diffuseColor.a *= cMask;
          }

          // uploaded graphics live in UV space, so they morph with the cloth;
          // ink reads as dielectric, so pull metalness down where it covers
          vec4 surf = texture2D(uSurfaceMap, vHoloUv);
          float surfA = surf.a * uSurfaceOpacity;
          diffuseColor.rgb = mix(diffuseColor.rgb, surf.rgb, surfA);
          metalnessFactor = mix(metalnessFactor, 0.05, surfA * 0.8);

          vec3 hView = normalize(vViewPosition);
          float facing = clamp(abs(dot(normal, hView)), 0.0, 1.0);
          float fres = pow(1.0 - facing, 1.5);

          // micro flake cells — each has a random phase so neighbouring
          // flakes catch different colors, like holo foil grain
          vec2 cellUv = vHoloUv * uHoloScale;
          vec2 cellId = floor(cellUv);
          float rnd = holoHash(cellId);
          float rnd2 = holoHash(cellId + 71.7);

          // diffraction sweep: broad smooth bands driven by view angle and
          // radial distance; flakes only nudge the phase slightly
          float radial = length(vHoloUv - 0.5) * uRadialFreq;
          float hue = fract(uHueShift + facing * uBandFreq + radial + rnd * 0.06);
          vec3 rainbow = holoHsv2rgb(vec3(hue, uSaturation, 1.0));

          // flake mask: soft variation so the foil reads as granular, not flat
          float flake = 0.82 + 0.18 * rnd2;

          // angle-gated glints: a sparse set of flakes flares at specific angles
          float gate = fract(rnd2 * 13.7 + facing * 6.0);
          float glint = smoothstep(1.0 - 0.012 * uSparkle, 1.0, gate) * 5.0;

          // rainbow brightest at grazing angles but present face-on too;
          // folds swallow the glow where cavity occlusion applies
          float energy = (0.22 + 0.78 * fres) * flake;
          float holoAO = 1.0 - uCavityAmount * vCavity * 0.8;
          totalEmissiveRadiance += rainbow * uHoloIntensity * (energy * 0.55 + glint * fres * 0.5) * holoAO;

          // tint the metallic F0 so specular reflections go iridescent —
          // this is what makes real holo foil flash color, not glow
          vec3 tinted = diffuseColor.rgb * (0.25 + rainbow * 1.9);
          diffuseColor.rgb = mix(diffuseColor.rgb, tinted, uSpecTint);
        }`,
        )
        .replace(
          '#include <aomap_fragment>',
          /* glsl */ `#include <aomap_fragment>
        {
          // cavity occlusion: deep folds see less of the environment.
          // Mirrors aomap_fragment's application points.
          float cavityAO = 1.0 - uCavityAmount * vCavity;
          reflectedLight.indirectDiffuse *= cavityAO;
          #if defined( USE_CLEARCOAT )
            clearcoatSpecularIndirect *= cavityAO;
          #endif
          #if defined( USE_SHEEN )
            sheenSpecularIndirect *= cavityAO;
          #endif
          #if defined( USE_ENVMAP ) && defined( STANDARD )
            float cavDotNV = saturate( dot( geometryNormal, geometryViewDir ) );
            reflectedLight.indirectSpecular *= computeSpecularOcclusion( cavDotNV, cavityAO, material.roughness );
          #endif
        }`,
        );
  };

  return { material, uniforms };
}
