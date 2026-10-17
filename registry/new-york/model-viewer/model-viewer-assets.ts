import {
  Box3,
  EquirectangularReflectionMapping,
  Mesh,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { DataTexture, Material, Object3D } from 'three';
import type { ModelBounds, ModelViewerEnvironment } from './types';

const HDRI_BASE =
  'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';
const DRACO_DECODERS =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const ENVIRONMENT_FILES: Record<
  Exclude<ModelViewerEnvironment, 'none'>,
  string
> = {
  apartment: 'lebombo_1k.hdr',
  city: 'potsdamer_platz_1k.hdr',
  dawn: 'kiara_1_dawn_1k.hdr',
  forest: 'forest_slope_1k.hdr',
  lobby: 'st_fagans_interior_1k.hdr',
  night: 'dikhololo_night_1k.hdr',
  park: 'rooitou_park_1k.hdr',
  studio: 'studio_small_03_1k.hdr',
  sunset: 'venice_sunset_1k.hdr',
  warehouse: 'empty_warehouse_01_1k.hdr',
};

/** Loads a studio HDRI preset as an equirectangular environment map. */
export function loadEnvironment(
  environment: Exclude<ModelViewerEnvironment, 'none'>,
): Promise<DataTexture> {
  return new HDRLoader()
    .loadAsync(HDRI_BASE + ENVIRONMENT_FILES[environment])
    .then((texture) => {
      texture.mapping = EquirectangularReflectionMapping;
      return texture;
    });
}

/**
 * Decode embedded glTF images through <img> instead of fetch(): blob: image
 * URLs are allowed by far more CSPs under img-src than under connect-src.
 */
function imageElementTextures(parser: GLTFParser) {
  parser.textureLoader = new TextureLoader(parser.options.manager);
  parser.textureLoader.setCrossOrigin(parser.options.crossOrigin);
  return { name: 'NXUI_image_element_textures' };
}

/** Loads a glb/gltf (Draco + Meshopt aware), fbx or obj model. */
export async function loadModel(url: string): Promise<Object3D> {
  const extension = (url.split('?')[0] ?? '').split('.').pop()?.toLowerCase();
  if (extension === 'fbx') return new FBXLoader().loadAsync(url);
  if (extension === 'obj') return new OBJLoader().loadAsync(url);
  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODERS);
  const loader = new GLTFLoader()
    .setDRACOLoader(draco)
    .setMeshoptDecoder(MeshoptDecoder)
    .register(imageElementTextures);
  try {
    const gltf = await loader.loadAsync(url);
    return gltf.scene;
  } finally {
    draco.dispose();
  }
}

/** Unit-fit bounds: scale so the longest side is 2, plus radius and floor. */
export function measureModel(object: Object3D): ModelBounds {
  const box = new Box3().setFromObject(object);
  const extent = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = 2 / Math.max(extent.x, extent.y, extent.z, 0.0001);
  return {
    scale,
    center,
    radius: (extent.length() / 2) * scale,
    floor: (extent.y / 2) * scale,
  };
}

function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose();
  }
  material.dispose();
}

/** Frees every geometry, material and texture under `object`. */
export function disposeModel(object: Object3D) {
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.geometry.dispose();
    const materials: Material[] = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach(disposeMaterial);
  });
}
