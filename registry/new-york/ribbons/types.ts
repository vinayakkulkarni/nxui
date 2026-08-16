import type { Polyline, Vec3 } from 'ogl';

export interface Line {
  spring: number;
  friction: number;
  mouseVelocity: InstanceType<typeof Vec3>;
  mouseOffset: InstanceType<typeof Vec3>;
  points: InstanceType<typeof Vec3>[];
  polyline: InstanceType<typeof Polyline>;
}
