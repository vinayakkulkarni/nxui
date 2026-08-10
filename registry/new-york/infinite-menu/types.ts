import type { vec2, vec3 } from 'gl-matrix';

export interface MenuItem {
  image: string;
  link?: string;
  title?: string;
  description?: string;
}

export interface Face {
  a: number;
  b: number;
  c: number;
}

export interface VertexData {
  position: vec3;
  normal: vec3;
  uv: vec2;
}
