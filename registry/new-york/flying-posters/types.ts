import type { Mesh, Program } from 'ogl';

export interface MediaState {
  plane: InstanceType<typeof Mesh>;
  program: InstanceType<typeof Program>;
  y: number;
  height: number;
  heightTotal: number;
  extra: number;
}
