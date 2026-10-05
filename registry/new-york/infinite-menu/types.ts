import type { Vec2Like, Vec3Like } from 'gl-matrix';

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
  position: Vec3Like;
  normal: Vec3Like;
  uv: Vec2Like;
}
