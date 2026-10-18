import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import type { Scene, WebGLRenderer } from 'three';
import type { ContactShadowOptions, ContactShadows } from './types';

/**
 * Soft contact shadow: renders the scene's depth from below into a render
 * target, blurs it twice and maps it onto a floor plane.
 */
export function createContactShadows(): ContactShadows {
  const resolution = 512;
  const group = new Group();
  group.rotation.x = Math.PI / 2;

  const renderTarget = new WebGLRenderTarget(resolution, resolution);
  const renderTargetBlur = new WebGLRenderTarget(resolution, resolution);
  renderTarget.texture.generateMipmaps = false;
  renderTargetBlur.texture.generateMipmaps = false;

  const planeGeometry = new PlaneGeometry(1, 1).rotateX(Math.PI / 2);
  const blurGeometry = new PlaneGeometry(1, 1);
  const blurPlane = new Mesh(blurGeometry);
  const blurCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
  blurCamera.position.set(0, 0, 1);
  blurCamera.updateMatrixWorld();
  const shadowMaterial = new MeshBasicMaterial({
    map: renderTarget.texture,
    transparent: true,
    depthWrite: false,
  });
  const plane = new Mesh(planeGeometry, shadowMaterial);
  plane.scale.set(1, -1, 1);
  plane.rotation.set(-Math.PI / 2, 0, 0);
  group.add(plane);

  const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
  group.add(camera);

  const shadowColor = { value: new Color('#000000') };
  const depthMaterial = new MeshDepthMaterial();
  depthMaterial.depthTest = false;
  depthMaterial.depthWrite = false;
  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.ucolor = shadowColor;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec3 ucolor;\nvoid main() {')
      .replace(
        'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );',
      );
  };

  const horizontalBlur = new ShaderMaterial(HorizontalBlurShader);
  const verticalBlur = new ShaderMaterial(VerticalBlurShader);
  horizontalBlur.depthTest = false;
  verticalBlur.depthTest = false;

  let size = 1;
  let far = 1;

  function blurShadows(renderer: WebGLRenderer, blur: number) {
    blurPlane.visible = true;
    blurPlane.material = horizontalBlur;
    horizontalBlur.uniforms.tDiffuse!.value = renderTarget.texture;
    horizontalBlur.uniforms.h!.value = blur / 256;
    renderer.setRenderTarget(renderTargetBlur);
    renderer.render(blurPlane, blurCamera);
    blurPlane.material = verticalBlur;
    verticalBlur.uniforms.tDiffuse!.value = renderTargetBlur.texture;
    verticalBlur.uniforms.v!.value = blur / 256;
    renderer.setRenderTarget(renderTarget);
    renderer.render(blurPlane, blurCamera);
    blurPlane.visible = false;
  }

  function configure(options: ContactShadowOptions) {
    group.position.set(0, options.y, 0);
    shadowMaterial.opacity = options.opacity;
    if (options.scale !== size || options.far !== far) {
      size = options.scale;
      far = options.far;
      plane.scale.set(size, -1, size);
      camera.left = -size / 2;
      camera.right = size / 2;
      camera.top = size / 2;
      camera.bottom = -size / 2;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  }

  function render(renderer: WebGLRenderer, scene: Scene, blur: number) {
    if (!group.visible) return;
    const background = scene.background;
    const override = scene.overrideMaterial;
    const previousTarget = renderer.getRenderTarget();
    scene.background = null;
    scene.overrideMaterial = depthMaterial;
    plane.visible = false;
    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera);
    blurShadows(renderer, blur);
    blurShadows(renderer, blur * 0.4);
    renderer.setRenderTarget(previousTarget);
    plane.visible = true;
    scene.overrideMaterial = override;
    scene.background = background;
  }

  function dispose() {
    renderTarget.dispose();
    renderTargetBlur.dispose();
    planeGeometry.dispose();
    blurGeometry.dispose();
    shadowMaterial.dispose();
    depthMaterial.dispose();
    horizontalBlur.dispose();
    verticalBlur.dispose();
  }

  return { group, configure, render, dispose };
}
