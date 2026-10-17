import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { clamp } from './bookshelf-layout';
import { coverTexture, paperTexture } from './bookshelf-textures';
import type {
  BookFlight,
  BookLayout,
  BookshelfEngine,
  ShelfRig,
} from './types';

const BOOK_ENTER_DURATION = 520;
export const BOOK_EXIT_DURATION = 400;

interface BookEntry {
  book: BookLayout;
  group: THREE.Group;
  mesh: THREE.Mesh<RoundedBoxGeometry, THREE.MeshStandardMaterial[]>;
  textures: (THREE.CanvasTexture | null)[];
  hovered: boolean;
  selected: boolean;
  wasSelected: boolean;
  selectedAt: number;
  focusFlight: BookFlight | null;
  exitFlight: BookFlight | null;
}

const lerp = THREE.MathUtils.lerp;

function damp(current: number, target: number, speed: number, delta: number) {
  return lerp(current, target, 1 - Math.exp(-speed * delta));
}

function bezierCoordinate(t: number, point1: number, point2: number) {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * point1 +
    3 * inverse * t * t * point2 +
    t * t * t
  );
}

/** cubic-bezier(0.22, 1, 0.36, 1) solved with Newton iterations. */
function easeSmoothOut(progress: number) {
  let t = progress;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const x = bezierCoordinate(t, 0.22, 0.36);
    const inverse = 1 - t;
    const slope =
      3 * inverse * inverse * 0.22 +
      6 * inverse * t * (0.36 - 0.22) +
      3 * t * t * (1 - 0.36);
    if (Math.abs(slope) < 0.0001) break;
    t = clamp(t - (x - progress) / slope, 0, 1);
  }
  return bezierCoordinate(t, 1, 1);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - (-2 * progress + 2) ** 3 / 2;
}

function snapshot(group: THREE.Group): BookFlight {
  return {
    startedAt: performance.now(),
    x: group.position.x,
    y: group.position.y,
    z: group.position.z,
    rotationX: group.rotation.x,
    rotationY: group.rotation.y,
    rotationZ: group.rotation.z,
    scale: group.scale.x,
  };
}

function material(
  map: THREE.CanvasTexture | null,
  mappedColor: string,
  fallbackColor: string,
  roughness: number,
  bumpScale: number,
  metalness = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map,
    color: map ? mappedColor : fallbackColor,
    roughness,
    metalness,
    bumpMap: map,
    bumpScale,
  });
}

function createBook(book: BookLayout, brand: string): BookEntry {
  const cover = coverTexture(book, brand, 'cover');
  const spine = coverTexture(book, brand, 'spine');
  const paper = paperTexture(book);
  const geometry = new RoundedBoxGeometry(
    book.width,
    book.bookHeight,
    book.depth,
    2,
    Math.min(book.width, 0.09),
  );
  // BoxGeometry groups: +x, -x, +y, -y, +z, -z.
  const materials = [
    material(cover, '#ffffff', book.color, 0.8, 0.007, 0.015),
    new THREE.MeshStandardMaterial({
      color: book.color,
      roughness: 0.84,
      bumpMap: cover,
      bumpScale: 0.006,
    }),
    material(paper, '#f1eadc', '#e9e4d8', 0.93, 0.008),
    material(paper, '#ece3d3', '#ddd7ca', 0.96, 0.006),
    material(spine, '#ffffff', book.color, 0.8, 0.007, 0.015),
    material(paper, '#f3eadc', '#e6e0d4', 0.94, 0.007),
  ];
  const mesh = new THREE.Mesh(geometry, materials);
  const group = new THREE.Group();
  group.position.set(book.x, book.bookHeight / 2, 0);
  group.add(mesh);
  return {
    book,
    group,
    mesh,
    textures: [cover, spine, paper],
    hovered: false,
    selected: false,
    wasSelected: false,
    selectedAt: 0,
    focusFlight: null,
    exitFlight: null,
  };
}

function disposeBook(entry: BookEntry) {
  entry.mesh.geometry.dispose();
  entry.mesh.material.forEach((item) => item.dispose());
  entry.textures.forEach((texture) => texture?.dispose());
}

function setSelected(entry: BookEntry, selected: boolean) {
  if (selected) {
    entry.selectedAt = performance.now();
    entry.focusFlight = snapshot(entry.group);
    entry.exitFlight = null;
  } else if (entry.wasSelected) {
    entry.exitFlight = snapshot(entry.group);
    entry.focusFlight = null;
  } else {
    entry.focusFlight = null;
  }
  entry.wasSelected = selected;
  entry.selected = selected;
  entry.mesh.renderOrder = selected ? 20 : 0;
  entry.mesh.material.forEach((item) => {
    item.depthTest = !selected;
    item.depthWrite = !selected;
  });
}

function stepBook(
  entry: BookEntry,
  rig: ShelfRig,
  reducedMotion: boolean,
  delta: number,
) {
  const { book, group: node, selected, hovered } = entry;
  const now = performance.now();
  const motion = reducedMotion ? 1000 : selected ? 7 : 11;
  const selectedFor = (now - entry.selectedAt) / 1000;
  const autoYaw =
    selected && !reducedMotion ? Math.sin(selectedFor * 0.85) * 0.3 : 0;
  const autoPitch =
    selected && !reducedMotion ? Math.sin(selectedFor * 0.55) * 0.04 : 0;
  const targetX = selected ? rig.cameraX : book.x;
  const targetY = selected ? 2.06 : book.bookHeight / 2 + (hovered ? 0.25 : 0);
  const targetZ = selected ? 1.8 : hovered ? 0.22 : 0;
  const targetScale = selected ? 0.96 : 1;
  const targetRotationY = selected ? -Math.PI / 2 + rig.yaw + autoYaw : 0;
  const targetRotationX = selected ? rig.pitch + autoPitch : 0;

  const flight = selected ? entry.focusFlight : null;
  if (flight) {
    const progress = reducedMotion
      ? 1
      : Math.min(1, (now - flight.startedAt) / BOOK_ENTER_DURATION);
    const depthProgress = easeSmoothOut(progress);
    const travelProgress = easeSmoothOut(clamp((progress - 0.06) / 0.94, 0, 1));
    const turnProgress = easeInOutCubic(progress);
    const depthArc = Math.sin(Math.PI * progress) * 0.12;
    node.position.set(
      lerp(flight.x, targetX, travelProgress),
      lerp(flight.y, targetY, travelProgress),
      lerp(flight.z, targetZ, depthProgress) + depthArc,
    );
    node.rotation.set(
      lerp(flight.rotationX, targetRotationX, turnProgress),
      lerp(flight.rotationY, targetRotationY, turnProgress),
      lerp(flight.rotationZ, 0, turnProgress),
    );
    node.scale.setScalar(lerp(flight.scale, targetScale, turnProgress));
    if (progress >= 1) entry.focusFlight = null;
  } else if (!selected && entry.exitFlight) {
    const exit = entry.exitFlight;
    const progress = reducedMotion
      ? 1
      : Math.min(1, (now - exit.startedAt) / BOOK_EXIT_DURATION);
    const alignProgress = easeSmoothOut(progress);
    const slotProgress = easeSmoothOut(clamp((progress - 0.3) / 0.7, 0, 1));
    node.position.set(
      lerp(exit.x, book.x, alignProgress),
      lerp(exit.y, book.bookHeight / 2, alignProgress),
      lerp(exit.z, 0, slotProgress),
    );
    node.rotation.set(
      lerp(exit.rotationX, 0, alignProgress),
      lerp(exit.rotationY, 0, alignProgress),
      lerp(exit.rotationZ, 0, alignProgress),
    );
    node.scale.setScalar(lerp(exit.scale, 1, alignProgress));
    if (progress >= 1) entry.exitFlight = null;
  } else {
    node.position.set(
      damp(node.position.x, targetX, motion, delta),
      damp(node.position.y, targetY, motion, delta),
      damp(node.position.z, targetZ, motion, delta),
    );
    node.rotation.y = damp(node.rotation.y, targetRotationY, motion, delta);
    node.rotation.x = damp(node.rotation.x, targetRotationX, motion, delta);
    node.scale.setScalar(damp(node.scale.x, targetScale, motion, delta));
  }
}

/** Three.js scene for the shelf: lights, camera rig, books, picking. */
export function createBookshelfEngine(
  canvas: HTMLCanvasElement,
  rig: ShelfRig,
): BookshelfEngine {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor('#000000', 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  // Starts at the shelf origin and glides to the first resting position.
  camera.position.set(0, 2.65, 10);
  scene.add(new THREE.AmbientLight('#ffffff', 1.5));
  scene.add(new THREE.HemisphereLight('#ffffff', '#d7dce8', 1.2));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(5, 8, 7);
  scene.add(sun);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let entries: BookEntry[] = [];
  let reducedMotion = false;

  function clearBooks() {
    entries.forEach((entry) => {
      scene.remove(entry.group);
      disposeBook(entry);
    });
    entries = [];
  }

  return {
    setBooks(books, brand) {
      clearBooks();
      entries = books.map((book) => createBook(book, brand));
      entries.forEach((entry, index) => {
        entry.mesh.userData.index = index;
        scene.add(entry.group);
      });
    },
    setView(view) {
      reducedMotion = view.reducedMotion;
      entries.forEach((entry, index) => {
        entry.hovered =
          view.hoveredIndex === index && view.selectedIndex === null;
        const selected = view.selectedIndex === index;
        if (selected !== entry.selected) setSelected(entry, selected);
      });
    },
    frame(delta) {
      camera.position.x = damp(camera.position.x, rig.cameraX, 8, delta);
      camera.lookAt(camera.position.x, 1.88, 0);
      entries.forEach((entry) => stepBook(entry, rig, reducedMotion, delta));
      renderer.render(scene, camera);
    },
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        entries.map((entry) => entry.mesh),
        false,
      )[0];
      const index: unknown = hit?.object.userData.index;
      return typeof index === 'number' ? index : null;
    },
    dispose() {
      clearBooks();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
